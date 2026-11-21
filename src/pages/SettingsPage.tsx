import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { FOODS } from '../data/foods';
import { RECIPES } from '../data/recipes';
import type { DietPrefs, Preferences } from '../lib/analysis';
import { newProfile, normalizeData } from '../lib/appData';
import { IMAGES } from '../lib/images';
import { mustResolve } from '../lib/ingredients';
import { norm } from '../lib/search';
import { useStore } from '../lib/store';
import { useI18n } from '../i18n/context';
import { compareText, LANGS, type Lang } from '../i18n/core';
import { messages } from '../i18n/content';

declare const __APP_VERSION__: string;
declare const __APP_COMMIT__: string;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type SwState = 'checking' | 'unsupported' | 'active' | 'installed' | 'none';
const SW_TEXT = { checking: 'swChecking', unsupported: 'swUnsupported', active: 'swActive', installed: 'swInstalled', none: 'swNone' } as const;

const LIMIT_IDS = FOODS.filter((f) => f.status === 'limit').map((f) => f.id);
const RECIPE_INGREDIENT_IDS = [...new Set(RECIPES.flatMap((r) => r.ingredients.map((i) => i.id)))];
/** Names in the current language, sorted alphabetically for that language. */
const namedSorted = (ids: string[]) => ids.map(mustResolve).sort((a, b) => compareText(a.name, b.name));
/** Megabytes with one decimal ("3.4" / "3,4"). */
const formatMb = (bytes: number, lang: Lang) => {
  const mb = (bytes / 1024 / 1024).toFixed(1);
  return lang === 'pt-BR' ? mb.replace('.', ',') : mb;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Never show the browser's install banner automatically; offer it only from Settings.
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
  });
}

function PickList({ items, selected, onToggle, label }: { items: { id: string; name: string }[]; selected: string[]; onToggle: (id: string) => void; label: string }) {
  const [q, setQ] = useState('');
  const { m } = useI18n();
  const shown = items.filter((i) => !q || norm(i.name).includes(norm(q)));
  return (
    <div>
      <input
        type="text"
        className="field"
        style={{ minHeight: 40, borderRadius: 10, border: '1px solid var(--line)', padding: '6px 10px', width: '100%', marginBottom: 8, background: 'var(--surface)' }}
        placeholder={m.settings.filter(label)}
        aria-label={m.settings.filter(label)}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="pickgrid" style={{ maxHeight: 240, overflowY: 'auto' }}>
        {shown.map((i) => (
          <button key={i.id} type="button" className="pick" aria-pressed={selected.includes(i.id)} onClick={() => onToggle(i.id)}>
            {i.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { profile, data, updateProfile, updateData, storage } = useStore();
  const { lang, m: t, setLanguage } = useI18n();
  const s = t.settings;
  const prefs = profile.prefs;
  const { hash } = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [estimate, setEstimate] = useState<number | null>(null);
  const [swState, setSwState] = useState<SwState>(() => ('serviceWorker' in navigator ? 'checking' : 'unsupported'));
  const [canInstall, setCanInstall] = useState(!!deferredPrompt);
  const standalone = typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true);
  const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
  // The page re-mounts on a language switch (see Layout), so these lists are rebuilt in the new language.
  const limitFoods = useMemo(() => namedSorted(LIMIT_IDS), []);
  const recipeIngredients = useMemo(() => namedSorted(RECIPE_INGREDIENT_IDS), []);

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted, () => setPersisted(null));
    navigator.storage?.estimate?.().then(
      (e) => setEstimate(e.usage != null ? e.usage : null),
      () => undefined,
    );
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((r) => setSwState(r?.active ? (navigator.serviceWorker.controller ? 'active' : 'installed') : 'none'));
    }
    const onPrompt = () => setCanInstall(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const setPrefs = (fn: (p: Preferences) => Preferences) => updateProfile((p) => ({ ...p, prefs: fn(p.prefs) }));
  const toggleIn = (key: 'tolerated' | 'excluded', id: string) =>
    setPrefs((p) => ({ ...p, [key]: p[key].includes(id) ? p[key].filter((x) => x !== id) : [...p[key], id] }));

  const photoStats = useMemo(() => {
    const v = Object.values(IMAGES);
    return { owner: v.filter((x) => x.match !== 'placeholder' && x.source === 'Owner-supplied').length, exact: v.filter((x) => x.match === 'exact').length, rep: v.filter((x) => x.match === 'representative').length, ph: v.filter((x) => x.match === 'placeholder').length };
  }, []);

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ app: 'my-fodmap-kitchen', exportedAt: new Date().toISOString(), ...data }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fodmap-kitchen-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setMsg(s.backupDownloaded);
  };

  const importData = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || !Array.isArray(parsed.profiles)) throw new Error('not a backup');
      const next = normalizeData(parsed);
      if (!confirm(s.confirmImport(next.profiles.length))) return;
      updateData(() => next);
      setMsg(s.restored);
    } catch {
      setMsg(s.invalidBackup);
    }
  };

  return (
    <>
      <div className="page-head">
        <h1>{s.title}</h1>
        <p>{s.intro}</p>
      </div>

      {msg && (
        <div className="notice info" role="status" style={{ marginBottom: 12 }}>
          {msg}
        </div>
      )}

      <section id="language" className="card section">
        <h2>{s.language}</h2>
        <div className="seg" role="group" aria-label={s.language}>
          {LANGS.map((l) => (
            <button key={l} lang={l} aria-pressed={lang === l} onClick={() => setLanguage(l)}>
              {messages(l).langName}
            </button>
          ))}
        </div>
        <p className="small muted" style={{ margin: '8px 0 0' }}>
          {s.languageHint}
        </p>
      </section>

      <section id="profiles" className="card section">
        <h2>{s.profiles}</h2>
        <div className="field">
          <label htmlFor="profile-select">{s.activeProfile}</label>
          <select id="profile-select" value={profile.id} onChange={(e) => updateData((d) => ({ ...d, activeProfileId: e.target.value }))}>
            {data.profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="profile-name">{s.profileName}</label>
          <input id="profile-name" type="text" maxLength={30} value={profile.name} onChange={(e) => updateProfile((p) => ({ ...p, name: e.target.value }))} />
        </div>
        <div className="row">
          <button
            className="btn"
            onClick={() => {
              const p = newProfile(s.personN(data.profiles.length + 1));
              updateData((d) => ({ ...d, profiles: [...d.profiles, p], activeProfileId: p.id }));
            }}
          >
            {s.addProfile}
          </button>
          {data.profiles.length > 1 && (
            <button
              className="btn danger"
              onClick={() => {
                if (!confirm(s.confirmDeleteProfile(profile.name))) return;
                updateData((d) => {
                  const profiles = d.profiles.filter((p) => p.id !== profile.id);
                  return { ...d, profiles, activeProfileId: profiles[0].id };
                });
              }}
            >
              {s.deleteProfile}
            </button>
          )}
        </div>
      </section>

      <section className="card section">
        <h2>{s.dietary}</h2>
        <div className="field">
          <span className="label">{s.phase}</span>
          <div className="seg" role="group" aria-label={s.phaseLabel}>
            <button aria-pressed={prefs.phase === 'elimination'} onClick={() => setPrefs((p) => ({ ...p, phase: 'elimination' }))}>
              {s.elimination}
            </button>
            <button aria-pressed={prefs.phase === 'reintroduction'} onClick={() => setPrefs((p) => ({ ...p, phase: 'reintroduction' }))}>
              {s.reintroduction}
            </button>
          </div>
          <span className="small muted">{s.phaseHint}</span>
        </div>
        <div className="field">
          <span className="label">{s.limitFoods}</span>
          <div className="seg" role="group" aria-label={s.limitLabel}>
            <button aria-pressed={prefs.limitHandling === 'warn'} onClick={() => setPrefs((p) => ({ ...p, limitHandling: 'warn' }))}>
              {s.limitWarn}
            </button>
            <button aria-pressed={prefs.limitHandling === 'exclude'} onClick={() => setPrefs((p) => ({ ...p, limitHandling: 'exclude' }))}>
              {s.limitExclude}
            </button>
          </div>
        </div>
        <div className="field">
          <label htmlFor="household">{s.household}</label>
          <select id="household" value={prefs.householdSize} onChange={(e) => setPrefs((p) => ({ ...p, householdSize: Number(e.target.value) }))}>
            {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {s.people(n)}
              </option>
            ))}
          </select>
        </div>
        <div>
          {(s.diets as [keyof DietPrefs, string, string][]).map(([k, label, hint]) => (
            <label key={k} className="toggle">
              <input type="checkbox" checked={prefs.diet[k]} onChange={(e) => setPrefs((p) => ({ ...p, diet: { ...p.diet, [k]: e.target.checked } }))} />
              <span>
                {label}
                <small>{hint}</small>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="card section">
        <h2>{s.excludedTitle(prefs.excluded.length)}</h2>
        <p className="small muted">{s.excludedHint}</p>
        <PickList items={recipeIngredients} selected={prefs.excluded} onToggle={(id) => toggleIn('excluded', id)} label={s.excludedFilter} />
      </section>

      <section className="card section">
        <h2>{s.toleratedTitle(prefs.tolerated.length)}</h2>
        <p className="small muted">{s.toleratedHint}</p>
        <PickList items={limitFoods} selected={prefs.tolerated} onToggle={(id) => toggleIn('tolerated', id)} label={s.toleratedFilter} />
      </section>

      <section className="card section" id="offline">
        <h2>{s.offline}</h2>
        <table className="meta">
          <tbody>
            <tr>
              <td>{s.offlineMode}</td>
              <td>{s[SW_TEXT[swState]]}</td>
            </tr>
            <tr>
              <td>{s.savedData}</td>
              <td>{storage === 'indexeddb' ? s.storageIdb : storage === 'memory' ? s.storageMemory : '…'}</td>
            </tr>
            <tr>
              <td>{s.protected}</td>
              <td>{persisted === null ? s.unknown : persisted ? s.yes : s.no}</td>
            </tr>
            {estimate != null && (
              <tr>
                <td>{s.storageUsed}</td>
                <td>{s.storageWhat(s.mbUsed(formatMb(estimate, lang)))}</td>
              </tr>
            )}
          </tbody>
        </table>
        {persisted === false && (
          <button className="btn" style={{ marginTop: 10 }} onClick={() => navigator.storage?.persist?.().then(setPersisted)}>
            {s.keepData}
          </button>
        )}
        <p className="small muted" style={{ marginTop: 10 }}>
          {s.offlineNote}
        </p>
      </section>

      <section className="card section">
        <h2>{s.install}</h2>
        {standalone ? (
          <p>{s.installed}</p>
        ) : canInstall ? (
          <button
            className="btn primary"
            onClick={async () => {
              if (!deferredPrompt) return;
              await deferredPrompt.prompt();
              await deferredPrompt.userChoice;
              deferredPrompt = null;
              setCanInstall(false);
            }}
          >
            {s.installButton}
          </button>
        ) : isIOS ? (
          <p>{s.installIos}</p>
        ) : (
          <p className="muted">{s.installOther}</p>
        )}
      </section>

      <section className="card section">
        <h2>{s.backup}</h2>
        <p className="small muted">{s.backupHint}</p>
        <div className="row">
          <button className="btn" onClick={exportData}>
            {s.exportData}
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            {s.importData}
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importData} />
        </div>
      </section>

      <section className="card section" id="disclaimer">
        <h2>{s.disclaimer}</h2>
        <p>
          {s.disclaimer1a}
          <strong>{s.disclaimer1b}</strong>
          {s.disclaimer1c}
        </p>
        <p>{s.disclaimer2}</p>
        <p>{s.disclaimer3}</p>
      </section>

      <section className="card section">
        <h2>{s.credits}</h2>
        <p className="small">
          {s.creditsA}
          <a href="https://www.foodiesfeed.com/" target="_blank" rel="noopener noreferrer">
            Foodiesfeed
          </a>
          {s.creditsB}
          <a href="https://www.foodiesfeed.com/license" target="_blank" rel="noopener noreferrer">
            {s.creditsLicence}
          </a>
          {s.creditsC(photoStats.owner, photoStats.exact, photoStats.rep, photoStats.ph)}
        </p>
      </section>

      <p className="small muted">{s.version(__APP_VERSION__, __APP_COMMIT__, FOODS.length, RECIPES.length)}</p>
    </>
  );
}
