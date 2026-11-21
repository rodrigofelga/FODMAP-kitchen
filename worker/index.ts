/**
 * Shared shopping lists API.
 *
 * Each shared list lives in its own Durable Object (SQLite storage, Workers
 * Free plan). Access uses unguessable capability tokens instead of accounts:
 *  - the owner gets a secret token when the list is created;
 *  - the owner can create an invite secret, sent only in the link's #fragment
 *    (never in a URL path or query, so it does not reach server logs);
 *  - joining with the invite gives each participant their own secret token,
 *    which the owner can revoke individually.
 * Only SHA-256 hashes of secrets are stored. No names, e-mails or other
 * personal data are collected; participants are numbered.
 *
 * Changes are operations applied in arrival order with the same pure rules
 * the app uses (src/lib/listModel.ts) and pushed to every connected device
 * over WebSockets (hibernation API, so idle connections cost nothing).
 */
import { DurableObject } from 'cloudflare:workers';
import { applyOp, sanitizeDoc, sanitizeOp, type ListDoc, type ListOp } from '../src/lib/listModel';

const MAX_BODY = 256 * 1024;
const MAX_MEMBERS = 12;
const INVITE_DAYS = 14;
const RECENT_OPS = 2000;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
  });
}

function b64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomSecret(bytes: number): string {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

async function sha256(s: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function readJson(req: Request): Promise<unknown> {
  const text = await req.text();
  if (text.length > MAX_BODY) throw new Error('too large');
  return text ? JSON.parse(text) : {};
}

const LIST_ID = /^[A-Za-z0-9_-]{22}$/;

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(req);
    const m = url.pathname.match(/^\/api\/lists(?:\/([^/]+))?(\/[a-z]+(?:\/[A-Za-z0-9_-]+)?)?\/?$/);
    if (!m) return json({ error: 'not_found' }, 404);
    let listId = m[1];
    const rest = m[2] ?? '';
    if (!listId) {
      if (req.method !== 'POST' || rest) return json({ error: 'method_not_allowed' }, 405);
      listId = randomSecret(16);
      const stub = env.LISTS.get(env.LISTS.idFromName(listId));
      return stub.fetch(new Request(`https://list/create`, { method: 'POST', body: req.body, headers: { 'x-list-id': listId } }));
    }
    if (!LIST_ID.test(listId)) return json({ error: 'not_found' }, 404);
    const stub = env.LISTS.get(env.LISTS.idFromName(listId));
    const inner = new Request(`https://list${rest || '/'}`, req);
    return stub.fetch(inner);
  },
} satisfies ExportedHandler<Env>;

interface Member {
  id: string;
  role: 'owner' | 'member';
  tokenHash: string;
  /** Display number ("Participant 2"); no names are stored. */
  n: number;
  joinedAt: number;
}

interface State {
  listId: string;
  createdAt: number;
  doc: ListDoc;
  version: number;
  members: Member[];
  invite: { hash: string; expiresAt: number } | null;
  nextN: number;
  recentOps: string[];
}

export class ShoppingList extends DurableObject<Env> {
  private state: State | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.state = (await ctx.storage.get<State>('state')) ?? null;
    });
    // Keep-alive pings are answered without waking the object.
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  private async save() {
    await this.ctx.storage.put('state', this.state);
  }

  private view(me: Member) {
    const s = this.state!;
    return {
      listId: s.listId,
      doc: s.doc,
      version: s.version,
      me: { memberId: me.id, role: me.role },
      members: s.members.map((x) => ({ memberId: x.id, role: x.role, n: x.n, joinedAt: x.joinedAt })),
      ...(me.role === 'owner' ? { invite: s.invite && s.invite.expiresAt > Date.now() ? { active: true, expiresAt: s.invite.expiresAt } : { active: false } } : {}),
    };
  }

  private async memberFor(token: string | null): Promise<Member | null> {
    if (!token || !this.state) return null;
    const h = await sha256(token);
    return this.state.members.find((m) => timingSafeEqual(m.tokenHash, h)) ?? null;
  }

  private broadcast() {
    if (!this.state) return;
    for (const ws of this.ctx.getWebSockets()) {
      const att = ws.deserializeAttachment() as { memberId?: string } | null;
      const member = att?.memberId ? this.state.members.find((m) => m.id === att.memberId) : undefined;
      if (!member) continue;
      try {
        ws.send(JSON.stringify({ type: 'state', ...this.view(member) }));
      } catch {
        // Socket already closing.
      }
    }
  }

  private closeSockets(memberId: string | null, code: number, reason: string) {
    for (const ws of this.ctx.getWebSockets()) {
      const att = ws.deserializeAttachment() as { memberId?: string } | null;
      if (memberId === null || att?.memberId === memberId) {
        try {
          ws.close(code, reason);
        } catch {
          // ignore
        }
      }
    }
  }

  private async newMember(role: Member['role']): Promise<{ member: Member; token: string }> {
    const token = randomSecret(32);
    const member: Member = { id: randomSecret(9), role, tokenHash: await sha256(token), n: this.state!.nextN++, joinedAt: Date.now() };
    this.state!.members.push(member);
    return { member, token };
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    try {
      if (path === '/create' && req.method === 'POST') {
        if (this.state) return json({ error: 'conflict' }, 409);
        const body = (await readJson(req)) as { doc?: unknown };
        const doc = sanitizeDoc(body.doc);
        if (!doc) return json({ error: 'bad_request' }, 400);
        this.state = { listId: req.headers.get('x-list-id')!, createdAt: Date.now(), doc, version: 1, members: [], invite: null, nextN: 1, recentOps: [] };
        const { member, token } = await this.newMember('owner');
        await this.save();
        return json({ ...this.view(member), token }, 201);
      }

      if (!this.state) return json({ error: 'gone' }, 404);

      if (path === '/ws') {
        if (req.headers.get('upgrade')?.toLowerCase() !== 'websocket') return json({ error: 'upgrade_required' }, 426);
        const pair = new WebSocketPair();
        // The client authenticates with its first message, so the token never appears in a URL.
        this.ctx.acceptWebSocket(pair[1]);
        return new Response(null, { status: 101, webSocket: pair[0] });
      }

      if (path === '/join' && req.method === 'POST') {
        const body = (await readJson(req)) as { invite?: unknown };
        const inv = this.state.invite;
        if (typeof body.invite !== 'string' || !inv || inv.expiresAt < Date.now() || !timingSafeEqual(await sha256(body.invite), inv.hash)) return json({ error: 'invalid_invite' }, 403);
        if (this.state.members.length >= MAX_MEMBERS) return json({ error: 'full' }, 403);
        const { member, token } = await this.newMember('member');
        await this.save();
        this.broadcast();
        return json({ ...this.view(member), token }, 201);
      }

      const auth = req.headers.get('authorization');
      const me = await this.memberFor(auth?.startsWith('Bearer ') ? auth.slice(7) : null);
      if (!me) return json({ error: 'forbidden' }, 403);

      if (path === '/' && req.method === 'GET') return json(this.view(me));

      if (path === '/ops' && req.method === 'POST') {
        const body = (await readJson(req)) as { ops?: unknown };
        const ops = (Array.isArray(body.ops) ? body.ops : []).slice(0, 200).map(sanitizeOp).filter((x): x is ListOp => !!x);
        const s = this.state;
        const seen = new Set(s.recentOps);
        let changed = false;
        for (const op of ops) {
          if (seen.has(op.opId)) continue; // a retried request: already applied
          const next = applyOp(s.doc, op, Date.now());
          seen.add(op.opId);
          s.recentOps.push(op.opId);
          if (next !== s.doc) {
            s.doc = next;
            changed = true;
          }
        }
        if (s.recentOps.length > RECENT_OPS) s.recentOps = s.recentOps.slice(-RECENT_OPS);
        if (changed) s.version++;
        if (ops.length) await this.save();
        if (changed) this.broadcast();
        return json(this.view(me));
      }

      if (path === '/leave' && req.method === 'POST') {
        if (me.role === 'owner') return json({ error: 'owner_cannot_leave' }, 400);
        this.state.members = this.state.members.filter((m) => m.id !== me.id);
        await this.save();
        this.closeSockets(me.id, 4003, 'left');
        this.broadcast();
        return json({ ok: true });
      }

      // Owner-only actions.
      if (me.role !== 'owner') return json({ error: 'forbidden' }, 403);

      if (path === '/invite' && req.method === 'POST') {
        const invite = randomSecret(18);
        this.state.invite = { hash: await sha256(invite), expiresAt: Date.now() + INVITE_DAYS * 86400_000 };
        await this.save();
        return json({ ...this.view(me), inviteToken: invite });
      }
      if (path === '/invite' && req.method === 'DELETE') {
        this.state.invite = null;
        await this.save();
        return json(this.view(me));
      }
      const rm = path.match(/^\/members\/([A-Za-z0-9_-]+)$/);
      if (rm && req.method === 'DELETE') {
        const target = this.state.members.find((m) => m.id === rm[1]);
        if (!target || target.role === 'owner') return json({ error: 'not_found' }, 404);
        this.state.members = this.state.members.filter((m) => m.id !== target.id);
        await this.save();
        this.closeSockets(target.id, 4003, 'revoked');
        this.broadcast();
        return json(this.view(me));
      }
      if (path === '/' && req.method === 'DELETE') {
        this.closeSockets(null, 4004, 'deleted');
        this.state = null;
        await this.ctx.storage.deleteAll();
        return json({ ok: true });
      }
      return json({ error: 'not_found' }, 404);
    } catch {
      return json({ error: 'bad_request' }, 400);
    }
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== 'string' || message.length > 4096) return;
    let msg: { type?: string; token?: string };
    try {
      msg = JSON.parse(message);
    } catch {
      return;
    }
    if (msg.type !== 'auth') return;
    const me = await this.memberFor(typeof msg.token === 'string' ? msg.token : null);
    if (!me) {
      ws.close(4003, 'forbidden');
      return;
    }
    ws.serializeAttachment({ memberId: me.id });
    ws.send(JSON.stringify({ type: 'state', ...this.view(me) }));
  }

  async webSocketClose(ws: WebSocket, code: number) {
    try {
      ws.close(code === 1005 ? 1000 : code, 'closed');
    } catch {
      // already closed
    }
  }
}
