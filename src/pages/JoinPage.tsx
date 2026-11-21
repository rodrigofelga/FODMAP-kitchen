import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { SharedListRef } from '../lib/appData';
import { useStore } from '../lib/store';
import { ApiError, isOffline, joinSharedList, parseInvite } from '../lib/sync';
import { useI18n } from '../i18n/context';

/** Opens an invite link (/join#<list>.<secret>). The secret never leaves the #fragment until "Join" is pressed. */
export function JoinPage() {
  const { hash } = useLocation();
  const navigate = useNavigate();
  const { profile, updateProfile } = useStore();
  const { m } = useI18n();
  const t = m.shopping;
  const [invite] = useState(() => parseInvite(hash));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(invite ? null : t.joinInvalid);
  const already = invite && profile.sharedLists.find((r) => r.listId === invite.listId && r.status === 'active');

  useEffect(() => {
    if (already) navigate(`/lists/${already.listId}`, { replace: true });
  }, [already, navigate]);

  const join = async () => {
    if (!invite) return;
    setErr(null);
    if (!navigator.onLine) return setErr(t.needsOnline);
    setBusy(true);
    try {
      const v = await joinSharedList(invite.listId, invite.invite);
      const ref: SharedListRef = { listId: v.listId, token: v.token, memberId: v.me.memberId, role: v.me.role, doc: v.doc, version: v.version, pending: [], status: 'active' };
      updateProfile((p) => ({ ...p, sharedLists: [...p.sharedLists.filter((r) => r.listId !== v.listId), ref] }));
      navigate(`/lists/${v.listId}`, { replace: true });
    } catch (e) {
      setErr(e instanceof ApiError && (e.status === 403 || e.status === 404) ? t.joinInvalid : isOffline(e) ? t.needsOnline : t.syncError);
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: '1.4rem' }}>{t.joinTitle}</h1>
      <p className="muted">{t.joinBody}</p>
      {invite && (
        <button type="button" className="btn primary" disabled={busy} onClick={join}>
          {busy ? t.joining : t.join}
        </button>
      )}
      {err && (
        <p className="notice warn" role="alert" style={{ marginTop: 12 }}>
          {err}
        </p>
      )}
      <p style={{ marginTop: 14 }}>
        <Link to="/planner?tab=grocery">{t.back}</Link>
      </p>
    </div>
  );
}
