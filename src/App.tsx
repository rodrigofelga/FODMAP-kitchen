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
import { NotFoundPage } from './pages/NotFoundPage';

function Gate() {
  const { loaded } = useStore();
  if (!loaded) {
    return (
      <div className="empty" role="status" style={{ paddingTop: '30vh' }}>
        Loading your kitchen…
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
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Gate />
      </BrowserRouter>
    </AppProvider>
  );
}
