import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useStore } from '../lib/store';
import { IconGuide, IconHome, IconPlanner, IconRecipes, IconSettings } from './Icons';
import { UpdatePrompt } from './UpdatePrompt';

const NAV = [
  { to: '/', label: 'Home', icon: IconHome, end: true },
  { to: '/guide', label: 'Food Guide', icon: IconGuide },
  { to: '/recipes', label: 'Recipes', icon: IconRecipes },
  { to: '/planner', label: 'Meal Planner', icon: IconPlanner },
  { to: '/settings', label: 'Settings', icon: IconSettings },
];

export function Layout() {
  const { profile, data } = useStore();
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand" aria-label="My FODMAP Kitchen home">
          <img src="/icons/icon-192.png" alt="" width={32} height={32} />
          <span>My FODMAP Kitchen</span>
        </Link>
        <span className="spacer" />
        {data.profiles.length > 1 && (
          <Link to="/settings#profiles" className="profile-chip" aria-label={`Active profile: ${profile.name}`}>
            {profile.name}
          </Link>
        )}
      </header>
      <nav className="tabbar" aria-label="Main">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}>
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <main id="main">
        <Outlet />
      </main>
      <UpdatePrompt />
    </div>
  );
}
