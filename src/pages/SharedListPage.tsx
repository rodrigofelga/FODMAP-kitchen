import { Link, useNavigate, useParams } from 'react-router-dom';
import { ExportBar, ShoppingList } from '../components/ShoppingList';
import { SharePanel, SyncBadge } from '../components/SharePanel';
import { useStore } from '../lib/store';
import { useSharedList } from '../lib/useSharedList';
import { useI18n } from '../i18n/context';

/** A grocery list someone shared with this device (or the owner's list opened directly). */
export function SharedListPage() {
  const { listId = '' } = useParams();
  const { profile } = useStore();
  const { m } = useI18n();
  const t = m.shopping;
  const navigate = useNavigate();
  const s = useSharedList(listId);
  const back = () => navigate('/planner?tab=grocery', { replace: true });

  if (!s.ref || !s.doc) {
    return (
      <div className="card">
        <h1 style={{ fontSize: '1.3rem' }}>{t.listTitle}</h1>
        <p className="muted">{t.gone}</p>
        <Link to="/planner?tab=grocery">{t.back}</Link>
      </div>
    );
  }
  const active = s.ref.status === 'active';
  return (
    <>
      <p className="no-print" style={{ margin: '0 0 10px' }}>
        <Link to="/planner?tab=grocery">{t.back}</Link>
      </p>
      {!active && <SharePanel sharedRef={s.ref} members={s.members} invite={s.invite} setInvite={s.setInvite} setMembers={s.setMembers} onLeft={back} />}
      <ShoppingList doc={s.doc} onOp={s.dispatch} pantrySelection={profile.pantrySelection} status={active ? <SyncBadge status={s.status} /> : undefined} />
      <ExportBar doc={s.doc} />
      {active && <SharePanel sharedRef={s.ref} members={s.members} invite={s.invite} setInvite={s.setInvite} setMembers={s.setMembers} onLeft={back} />}
    </>
  );
}
