// Composant racine : définit toutes les routes de l'application et
// la structure commune (barre de navigation inférieure type mobile).
import { Routes, Route, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Board from './pages/Board.jsx';
import CreateGoal from './pages/CreateGoal.jsx';
import GoalDetail from './pages/GoalDetail.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import Badges from './pages/Badges.jsx';

function App() {
  const location = useLocation();
  // La barre de navigation est masquée sur les écrans d'authentification
  const hideNav = ['/login', '/register'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Routes>
        {/* La page d'accueil est le board des objectifs */}
        <Route path="/" element={<Board />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/goals/new" element={<CreateGoal />} />
        <Route path="/goals/:id" element={<GoalDetail />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/badges" element={<Badges />} />
      </Routes>
      {!hideNav && <BottomNav />}
    </div>
  );
}

export default App;