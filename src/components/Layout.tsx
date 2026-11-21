import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useStore } from '../lib/store';
import { IconGuide, IconHome, IconPlanner, IconRecipes, IconSettings } from './Icons';
import { UpdatePrompt } from './UpdatePrompt';
import { useI18n } from '../i18n/context';

const NAV = [
  { to: '/', key: 'home', icon: IconHome, end: true },
  { to: '/guide', key: 'guide', icon: IconGuide },
  { to: '/recipes', key: 'recipes', icon: IconRecipes },
  { to: '/planner', key: 'planner', icon: IconPlanner },
  { to: '/settings', key: 'settings', icon: IconSettings },
] as const;

export function Layout() {
  const { profile, data } = useStore();
  const { lang, m } = useI18n();
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand" aria-label={m.nav.brandHome}>
          <img src="/icons/icon-192.png" alt="" width={32} height={32} />
          <span>{m.common.appName}</span>
        </Link>
        <span className="spacer" />
        {data.profiles.length > 1 && (
          <Link to="/settings#profiles" className="profile-chip" aria-label={m.nav.activeProfile(profile.name)}>
            {profile.name}
          </Link>
        )}
      </header>
      <nav className="tabbar" aria-label={m.nav.label}>
        {NAV.map(({ to, key, icon: Icon, ...rest }) => (
          <NavLink key={to} to={to} end={'end' in rest}>
            <Icon />
            <span>{m.nav[key]}</span>
          </NavLink>
        ))}
      </nav>
      <main id="main">
        {/* Re-mount the page on a language switch so every derived list and sort is rebuilt in the new language. */}
        <Outlet key={lang} />
      </main>
      <UpdatePrompt />
    </div>
  );
}
