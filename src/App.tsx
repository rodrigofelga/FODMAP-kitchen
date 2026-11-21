import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from './components/AppProvider';
import { Layout } from './components/Layout';
import { useStore } from './lib/store';
import { HomePage } from './pages/HomePage';
import { FoodGuidePage } from './pages/FoodGuidePage';
import { RecipesPage } from './pages/RecipesPage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { MatcherPage } from './pages/MatcherPage';
import { PlannerPage } from './pages/PlannerPage';
import { SettingsPage } from './pages/SettingsPage';
import { SharedListPage } from './pages/SharedListPage';
import { JoinPage } from './pages/JoinPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { LanguageProvider } from './i18n/LanguageProvider';
import { useI18n } from './i18n/context';

function Gate() {
  const { loaded } = useStore();
  const { m } = useI18n();
  if (!loaded) {
    return (
      <div className="empty" role="status" style={{ paddingTop: '30vh' }}>
        {m.common.loading}
      </div>
    );
  }
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="guide" element={<FoodGuidePage />} />
        <Route path="recipes" element={<RecipesPage />} />
        <Route path="recipes/:id" element={<RecipeDetailPage />} />
        <Route path="matcher" element={<MatcherPage />} />
        <Route path="planner" element={<PlannerPage />} />
        <Route path="lists/:listId" element={<SharedListPage />} />
        <Route path="join" element={<JoinPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <AppProvider>
        <BrowserRouter>
          <Gate />
        </BrowserRouter>
      </AppProvider>
    </LanguageProvider>
  );
}
