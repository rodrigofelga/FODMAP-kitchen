import { useState } from 'react';
import type { SharedListRef } from '../lib/appData';
import type { ListDoc } from '../lib/listModel';
import type { MealPlan } from '../lib/planner';
import { useStore } from '../lib/store';
import { copyText } from '../lib/share';
import { createInvite, createSharedList, deleteSharedList, disableInvite, effectiveDoc, inviteUrl, isOffline, leaveList, removeMember, type MemberInfo, type ServerView } from '../lib/sync';
import type { SyncStatus } from '../lib/useSharedList';
import { useI18n } from '../i18n/context';

export function SyncBadge({ status }: { status: SyncStatus }) {
  const { m } = useI18n();
  const t = m.shopping;
  const label = { synced: t.synced, syncing: t.syncing, offline: t.offline, error: t.syncError }[status];
  return (
    <span className={`sync-badge ${status}`} role="status" data-sync={status}>
      <span className="dot" aria-hidden="true" /> {t.shared} · {label}
    </span>
  );
}

/** Offer to share a list that only exists on this device. */
export function StartSharing({ plan, doc }: { plan: MealPlan; doc: ListDoc }) {
  const { m } = useI18n();
  const t = m.shopping;
  const { updateProfile } = useStore();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const start = async () => {
    setErr(null);
    if (!navigator.onLine) return setErr(t.needsOnline);
    setBusy(true);
    try {
      const v = await createSharedList(doc);
      const inv = await createInvite({ listId: v.listId, token: v.token });
      const ref: SharedListRef = { listId: v.listId, token: v.token, memberId: v.me.memberId, role: 'owner', doc: inv.doc, version: inv.version, pending: [], status: 'active', invite: inv.inviteToken };
      updateProfile((p) => ({
        ...p,
        sharedLists: [...p.sharedLists, ref],
        plans: p.plans.map((x) => (x.id === plan.id ? { ...x, sharedListId: v.listId } : x)),
      }));
    } catch (e) {
      setErr(isOffline(e) ? t.needsOnline : t.syncError);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="card section no-print share-panel" aria-labelledby="share-h">
      <h2 id="share-h" style={{ fontSize: '1.1rem' }}>
        {t.liveTitle}
      </h2>
      <p className="small muted">{t.liveIntro}</p>
      <button type="button" className="btn primary" disabled={busy} onClick={start}>
        {t.startSharing}
      </button>
      {err && (
        <p className="small" role="alert" style={{ margin: '8px 0 0' }}>
          {err}
        </p>
      )}
    </section>
  );
}

interface PanelProps {
  sharedRef: SharedListRef;
  members: MemberInfo[];
  invite: ServerView['invite'];
  setInvite: (i: ServerView['invite']) => void;
  setMembers: (m: MemberInfo[]) => void;
  onLeft?: () => void;
}

/** Invite link, people with access, stop sharing / leave. */
export function SharePanel({ sharedRef, members, invite, setInvite, setMembers, onLeft }: PanelProps) {
  const { m } = useI18n();
  const t = m.shopping;
  const { updateProfile } = useStore();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const owner = sharedRef.role === 'owner';
  const link = owner && sharedRef.invite && invite?.active !== false ? inviteUrl(sharedRef.listId, sharedRef.invite) : null;

  const run = async (fn: () => Promise<void>) => {
    setMsg(null);
    if (!navigator.onLine) return setMsg(t.needsOnline);
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setMsg(isOffline(e) ? t.needsOnline : t.syncError);
    } finally {
      setBusy(false);
    }
  };

  const setRefInvite = (invite: string | undefined) =>
    updateProfile((p) => ({ ...p, sharedLists: p.sharedLists.map((r) => (r.listId === sharedRef.listId ? { ...r, invite } : r)) }));

  /** Removes the list from this device; the owner's plan keeps its own copy. */
  const forget = () =>
    updateProfile((p) => {
      const r = p.sharedLists.find((x) => x.listId === sharedRef.listId);
      return {
        ...p,
        sharedLists: p.sharedLists.filter((x) => x.listId !== sharedRef.listId),
        plans: p.plans.map((x) => {
          if (x.sharedListId !== sharedRef.listId) return x;
          const next = { ...x, ...(r ? { grocery: effectiveDoc(r) } : {}) };
          delete next.sharedListId;
          return next;
        }),
      };
    });

  if (sharedRef.status !== 'active') {
    return (
      <div className="notice warn no-print" role="alert" style={{ marginBottom: 12 }}>
        {sharedRef.status === 'revoked' ? t.revoked : t.gone}{' '}
        <button
          type="button"
          className="btn small"
          onClick={() => {
            forget();
            onLeft?.();
          }}
        >
          {t.removeFromDevice}
        </button>
      </div>
    );
  }

  return (
    <section className="card section no-print share-panel" aria-labelledby="share-h">
      <h2 id="share-h" style={{ fontSize: '1.1rem' }}>
        {t.liveTitle}
      </h2>
      {owner && (
        <>
          {link ? (
            <div className="field">
              <label htmlFor="invite-link">{t.inviteLink}</label>
              <input id="invite-link" type="text" readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
              <p className="small muted" style={{ margin: '4px 0 8px' }}>
                {t.inviteHint}
              </p>
              <div className="row">
                <button type="button" className="btn small primary" onClick={async () => setMsg((await copyText(link)) ? t.copied : t.shareFailed)}>
                  {t.copyLink}
                </button>
                {typeof navigator.share === 'function' && (
                  <button
                    type="button"
                    className="btn small"
                    onClick={() => navigator.share({ title: t.listTitle, text: t.inviteText, url: link }).catch(() => undefined)}
                  >
                    {t.sendInvite}
                  </button>
                )}
                <button
                  type="button"
                  className="btn small ghost"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      const v = await disableInvite(sharedRef);
                      setInvite(v.invite);
                      setRefInvite(undefined);
                    })
                  }
                >
                  {t.disableLink}
                </button>
              </div>
            </div>
          ) : (
            <p className="small muted">{t.linkOff}</p>
          )}
          <button
            type="button"
            className="btn small"
            disabled={busy}
            style={{ marginTop: 8 }}
            onClick={() =>
              run(async () => {
                const v = await createInvite(sharedRef);
                setInvite(v.invite);
                setRefInvite(v.inviteToken);
              })
            }
          >
            {t.newLink}
          </button>
        </>
      )}

      {members.length > 0 && (
        <>
          <h3 style={{ marginTop: 14 }}>{t.members}</h3>
          <ul className="members">
            {members.map((x) => (
              <li key={x.memberId} data-member={x.n}>
                <span>
                  {x.role === 'owner' ? t.owner : t.participant(x.n)} {x.memberId === sharedRef.memberId && <span className="muted">{t.you}</span>}
                </span>
                {owner && x.role !== 'owner' && (
                  <button
                    type="button"
                    className="btn small danger"
                    disabled={busy}
                    onClick={() => {
                      if (!confirm(t.removeConfirm)) return;
                      void run(async () => setMembers((await removeMember(sharedRef, x.memberId)).members));
                    }}
                  >
                    {t.remove}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="row" style={{ marginTop: 12 }}>
        {owner ? (
          <button
            type="button"
            className="btn small danger"
            disabled={busy}
            onClick={() => {
              if (!confirm(t.stopConfirm)) return;
              void run(async () => {
                await deleteSharedList(sharedRef);
                forget();
              });
            }}
          >
            {t.stopSharing}
          </button>
        ) : (
          <button
            type="button"
            className="btn small danger"
            disabled={busy}
            onClick={() => {
              if (!confirm(t.leaveConfirm)) return;
              void run(async () => {
                await leaveList(sharedRef);
                forget();
                onLeft?.();
              });
            }}
          >
            {t.leave}
          </button>
        )}
      </div>
      {msg && (
        <p className="small" role="status" style={{ margin: '8px 0 0' }}>
          {msg}
        </p>
      )}
    </section>
  );
}
