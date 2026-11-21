import { useRegisterSW } from 'virtual:pwa-register/react';
import { useI18n } from '../i18n/context';

/**
 * Shows a small toast when a new version has been downloaded. The new service
 * worker only takes over when the user taps "Update", so nothing changes under
 * them mid-task. Saved data lives in IndexedDB and is untouched by updates.
 */
export function UpdatePrompt() {
  const { m } = useI18n();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      if (!reg) return;
      // Check for updates hourly while the app stays open.
      setInterval(() => {
        if (navigator.onLine) reg.update().catch(() => undefined);
      }, 60 * 60 * 1000);
    },
  });

  if (needRefresh) {
    return (
      <div className="update-toast" role="status">
        <span>{m.update.ready}</span>
        <span className="row">
          <button className="btn small ghost" style={{ color: 'inherit' }} onClick={() => setNeedRefresh(false)}>
            {m.update.later}
          </button>
          <button className="btn small primary" onClick={() => updateServiceWorker(true)}>
            {m.update.update}
          </button>
        </span>
      </div>
    );
  }
  // "Offline ready" is reported quietly in Settings rather than with a toast.
  return null;
}
