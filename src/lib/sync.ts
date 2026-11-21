/**
 * Client for the shared-list API (worker/index.ts). Secrets travel only in
 * request bodies/headers and the first WebSocket message, never in URLs.
 */
import { applyOp, type ListDoc, type ListOp } from './listModel';
import type { SharedListRef } from './appData';

export interface MemberInfo {
  memberId: string;
  role: 'owner' | 'member';
  n: number;
  joinedAt: number;
}

export interface ServerView {
  listId: string;
  doc: ListDoc;
  version: number;
  me: { memberId: string; role: 'owner' | 'member' };
  members: MemberInfo[];
  invite?: { active: boolean; expiresAt?: number };
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

/** Network failures (offline) are distinguished from server answers. */
export const isOffline = (e: unknown) => !(e instanceof ApiError);

async function call<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (init.token) headers.authorization = `Bearer ${init.token}`;
  const res = await fetch(`/api/lists${path}`, { ...init, headers, cache: 'no-store' });
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, (body as { error?: string } | null)?.error ?? 'error');
  return body as T;
}

export async function createSharedList(doc: ListDoc): Promise<ServerView & { token: string }> {
  return call('', { method: 'POST', body: JSON.stringify({ doc }) });
}

export async function joinSharedList(listId: string, invite: string): Promise<ServerView & { token: string }> {
  return call(`/${listId}/join`, { method: 'POST', body: JSON.stringify({ invite }) });
}

export const fetchList = (ref: Pick<SharedListRef, 'listId' | 'token'>) => call<ServerView>(`/${ref.listId}`, { token: ref.token });

export const sendOps = (ref: Pick<SharedListRef, 'listId' | 'token'>, ops: ListOp[]) =>
  call<ServerView>(`/${ref.listId}/ops`, { method: 'POST', token: ref.token, body: JSON.stringify({ ops }) });

export const createInvite = (ref: Pick<SharedListRef, 'listId' | 'token'>) =>
  call<ServerView & { inviteToken: string }>(`/${ref.listId}/invite`, { method: 'POST', token: ref.token });

export const disableInvite = (ref: Pick<SharedListRef, 'listId' | 'token'>) => call<ServerView>(`/${ref.listId}/invite`, { method: 'DELETE', token: ref.token });

export const removeMember = (ref: Pick<SharedListRef, 'listId' | 'token'>, memberId: string) =>
  call<ServerView>(`/${ref.listId}/members/${memberId}`, { method: 'DELETE', token: ref.token });

export const leaveList = (ref: Pick<SharedListRef, 'listId' | 'token'>) => call<{ ok: true }>(`/${ref.listId}/leave`, { method: 'POST', token: ref.token });

export const deleteSharedList = (ref: Pick<SharedListRef, 'listId' | 'token'>) => call<{ ok: true }>(`/${ref.listId}`, { method: 'DELETE', token: ref.token });

/** Invite link: the secret is in the #fragment, which browsers never send to the server. */
export function inviteUrl(listId: string, invite: string, origin = location.origin): string {
  return `${origin}/join#${listId}.${invite}`;
}

export function parseInvite(hash: string): { listId: string; invite: string } | null {
  const m = hash.replace(/^#/, '').match(/^([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]{16,64})$/);
  return m ? { listId: m[1], invite: m[2] } : null;
}

/** What the person sees: the last server copy with their unconfirmed changes applied on top. */
export function effectiveDoc(ref: SharedListRef): ListDoc {
  return ref.pending.reduce((d, op) => applyOp(d, op, Date.now()), ref.doc);
}

export function wsUrl(listId: string): string {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.host}/api/lists/${listId}/ws`;
}
