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

declare const __APP_VERSION__: string;
declare const __APP_COMMIT__: string;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DIET_LABELS: [keyof DietPrefs, string, string][] = [
  ['vegetarian', 'Vegetarian', 'Hide recipes with meat, poultry, fish or seafood.'],
  ['pescatarian', 'Pescatarian', 'Hide recipes with meat or poultry.'],
  ['noPork', 'No pork', 'Hide recipes with pork, bacon, ham or sausages.'],
  ['dairyFree', 'Dairy-free', 'Hide recipes with any dairy, including lactose-free dairy and butter.'],
  ['eggFree', 'Egg-free', 'Hide recipes with eggs or mayonnaise.'],
  ['nutFree', 'Nut- and peanut-free', 'Hide recipes with nuts or peanuts.'],
  ['noSpicy', 'No chili', 'Hide recipes with hot peppers.'],
];

const LIMIT_FOODS = FOODS.filter((f) => f.status === 'limit').sort((a, b) => a.name.localeCompare(b.name));
const RECIPE_INGREDIENTS = [...new Set(RECIPES.flatMap((r) => r.ingredients.map((i) => i.id)))].map(mustResolve).sort((a, b) => a.name.localeCompare(b.name));

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
  const shown = items.filter((i) => !q || norm(i.name).includes(norm(q)));
  return (
    <div>
      <input type="text" className="field" style={{ minHeight: 40, borderRadius: 10, border: '1px solid var(--line)', padding: '6px 10px', width: '100%', marginBottom: 8, background: 'var(--surface)' }} placeholder={`Filter ${label}`} aria-label={`Filter ${label}`} value={q} onChange={(e) => setQ(e.target.value)} />
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
  const prefs = profile.prefs;
  const { hash } = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [estimate, setEstimate] = useState<string | null>(null);
  const [swState, setSwState] = useState(() => ('serviceWorker' in navigator ? 'checking…' : 'Not supported by this browser'));
  const [canInstall, setCanInstall] = useState(!!deferredPrompt);
  const standalone = typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true);
  const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted, () => setPersisted(null));
    navigator.storage?.estimate?.().then(
      (e) => setEstimate(e.usage != null ? `${(e.usage / 1024 / 1024).toFixed(1)} MB used` : null),
      () => undefined,
    );
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((r) => setSwState(r?.active ? (navigator.serviceWorker.controller ? 'Active — app works offline' : 'Installed — reload once to enable offline') : 'Not installed yet'));
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
    setMsg('Backup downloaded.');
  };

  const importData = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || !Array.isArray(parsed.profiles)) throw new Error('not a backup');
      const next = normalizeData(parsed);
      if (!confirm(`Replace all data on this device with the backup (${next.profiles.length} profile(s))?`)) return;
      updateData(() => next);
      setMsg('Backup restored.');
    } catch {
      setMsg('That file is not a valid My FODMAP Kitchen backup.');
    }
  };

  return (
    <>
      <div className="page-head">
        <h1>Settings</h1>
        <p>Preferences are saved on this device only. Each household member can have a separate profile.</p>
      </div>

      {msg && (
        <div className="notice info" role="status" style={{ marginBottom: 12 }}>
          {msg}
        </div>
      )}

      <section id="profiles" className="card section">
        <h2>Profiles</h2>
        <div className="field">
          <label htmlFor="profile-select">Active profile</label>
          <select id="profile-select" value={profile.id} onChange={(e) => updateData((d) => ({ ...d, activeProfileId: e.target.value }))}>
            {data.profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="profile-name">Profile name</label>
          <input id="profile-name" type="text" maxLength={30} value={profile.name} onChange={(e) => updateProfile((p) => ({ ...p, name: e.target.value }))} />
        </div>
        <div className="row">
          <button
            className="btn"
            onClick={() => {
              const p = newProfile(`Person ${data.profiles.length + 1}`);
              updateData((d) => ({ ...d, profiles: [...d.profiles, p], activeProfileId: p.id }));
            }}
          >
            Add profile
          </button>
          {data.profiles.length > 1 && (
            <button
              className="btn danger"
              onClick={() => {
                if (!confirm(`Delete profile “${profile.name}” and its plans and favourites? This cannot be undone.`)) return;
                updateData((d) => {
                  const profiles = d.profiles.filter((p) => p.id !== profile.id);
                  return { ...d, profiles, activeProfileId: profiles[0].id };
                });
              }}
            >
              Delete this profile
            </button>
          )}
        </div>
      </section>

      <section className="card section">
        <h2>Dietary preferences</h2>
        <div className="field">
          <span className="label">Phase</span>
          <div className="seg" role="group" aria-label="Diet phase">
            <button aria-pressed={prefs.phase === 'elimination'} onClick={() => setPrefs((p) => ({ ...p, phase: 'elimination' }))}>
              Elimination
            </button>
            <button aria-pressed={prefs.phase === 'reintroduction'} onClick={() => setPrefs((p) => ({ ...p, phase: 'reintroduction' }))}>
              Reintroduction
            </button>
          </div>
          <span className="small muted">During elimination, any recipe with an AVOID FOR NOW food is excluded.</span>
        </div>
        <div className="field">
          <span className="label">LIMIT / CHECK foods</span>
          <div className="seg" role="group" aria-label="LIMIT food handling">
            <button aria-pressed={prefs.limitHandling === 'warn'} onClick={() => setPrefs((p) => ({ ...p, limitHandling: 'warn' }))}>
              Show with portion checks
            </button>
            <button aria-pressed={prefs.limitHandling === 'exclude'} onClick={() => setPrefs((p) => ({ ...p, limitHandling: 'exclude' }))}>
              Hide recipes using them
            </button>
          </div>
        </div>
        <div className="field">
          <label htmlFor="household">Household size for grocery lists</label>
          <select id="household" value={prefs.householdSize} onChange={(e) => setPrefs((p) => ({ ...p, householdSize: Number(e.target.value) }))}>
            {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'person' : 'people'}
              </option>
            ))}
          </select>
        </div>
        <div>
          {DIET_LABELS.map(([k, label, hint]) => (
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
        <h2>Excluded ingredients ({prefs.excluded.length})</h2>
        <p className="small muted">Recipes needing these are never recommended; optional uses are flagged “leave out”.</p>
        <PickList items={RECIPE_INGREDIENTS} selected={prefs.excluded} onToggle={(id) => toggleIn('excluded', id)} label="ingredients" />
      </section>

      <section className="card section">
        <h2>LIMIT foods I tolerate ({prefs.tolerated.length})</h2>
        <p className="small muted">Mark LIMIT / CHECK foods you have successfully reintroduced with your dietitian. Portion amounts are still shown.</p>
        <PickList items={LIMIT_FOODS} selected={prefs.tolerated} onToggle={(id) => toggleIn('tolerated', id)} label="LIMIT foods" />
      </section>

      <section className="card section" id="offline">
        <h2>Offline &amp; storage</h2>
        <table className="meta">
          <tbody>
            <tr>
              <td>Offline mode</td>
              <td>{swState}</td>
            </tr>
            <tr>
              <td>Saved data</td>
              <td>{storage === 'indexeddb' ? 'IndexedDB on this device' : storage === 'memory' ? 'Temporary (this browser blocks storage — data is lost on close)' : '…'}</td>
            </tr>
            <tr>
              <td>Protected from cleanup</td>
              <td>{persisted === null ? 'Unknown' : persisted ? 'Yes' : 'No'}</td>
            </tr>
            {estimate && (
              <tr>
                <td>Storage used</td>
                <td>{estimate} (app, recipes and photos)</td>
              </tr>
            )}
          </tbody>
        </table>
        {persisted === false && (
          <button className="btn" style={{ marginTop: 10 }} onClick={() => navigator.storage?.persist?.().then(setPersisted)}>
            Ask browser to keep my data
          </button>
        )}
        <p className="small muted" style={{ marginTop: 10 }}>
          The food guide, all recipes and recipe photos are stored for offline use. App updates never erase your saved preferences, favourites or plans.
        </p>
      </section>

      <section className="card section">
        <h2>Install the app</h2>
        {standalone ? (
          <p>✅ My FODMAP Kitchen is installed on this device.</p>
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
            Install My FODMAP Kitchen
          </button>
        ) : isIOS ? (
          <p>On iPhone or iPad: open this site in Safari, tap the Share button, then “Add to Home Screen”.</p>
        ) : (
          <p className="muted">Use your browser’s menu and choose “Install app” or “Add to Home screen”.</p>
        )}
      </section>

      <section className="card section">
        <h2>Backup &amp; restore</h2>
        <p className="small muted">Export all profiles, preferences, favourites and meal plans to a file, or restore from one.</p>
        <div className="row">
          <button className="btn" onClick={exportData}>
            Export data
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Import data
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importData} />
        </div>
      </section>

      <section className="card section" id="disclaimer">
        <h2>Dietary disclaimer</h2>
        <p>
          My FODMAP Kitchen is an organiser for a personal food guide. It is <strong>not medical advice</strong> and does not diagnose or treat IBS or any other condition. The food
          classifications come from the supplied guide (“IBS low-FODMAP food guide”, 5 pages) and have not been independently verified.
        </p>
        <p>
          The low-FODMAP diet is normally followed for a short elimination period (2–6 weeks, per the guide) and then foods are reintroduced — ideally with a registered dietitian. FODMAP
          content depends on portion size, ripeness, brand and recipe; always read labels for onion, garlic, wheat, lactose and polyols. LIMIT / CHECK foods are never treated as automatically
          safe. Ingredients marked “Not in guide” are not classified by the source guide.
        </p>
        <p>If you have severe, worsening or new symptoms — such as weight loss, bleeding or night-time symptoms — speak to a doctor.</p>
      </section>

      <section className="card section">
        <h2>Photo credits</h2>
        <p className="small">
          Most recipe photos come from <a href="https://www.foodiesfeed.com/" target="_blank" rel="noopener noreferrer">Foodiesfeed</a> under the{' '}
          <a href="https://www.foodiesfeed.com/license" target="_blank" rel="noopener noreferrer">
            Foodiesfeed licence
          </a>{' '}
          (CC0-equivalent; free for commercial use, no attribution required). Sponsored third-party stock images shown on Foodiesfeed were not used. {photoStats.exact} photos show the
          actual dish, {photoStats.rep} are labelled “Representative photo”, and {photoStats.ph} recipes use a placeholder because no accurate licensed photo was found. Each recipe page links
          to its photo source. {photoStats.owner} of the dish photos were supplied by the app owner rather than Foodiesfeed.
        </p>
      </section>

      <p className="small muted">
        Version {__APP_VERSION__} · build {__APP_COMMIT__} · {FOODS.length} foods · {RECIPES.length} recipes
      </p>
    </>
  );
}
