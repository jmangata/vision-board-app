// App.jsx : composant racine de l'application.
// Il centralise la déclaration des routes et conditionne l'affichage de la barre
// de navigation inférieure pour ne pas la montrer sur les pages de connexion.
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
import Slideshow from './pages/Slideshow.jsx';

function App() {
  const location = useLocation();
  // On masque la barre de navigation sur les écrans d'authentification.
  const hideNav = ['/login', '/register'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Routes>
        <Route path="/" element={<Board />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/goals/new" element={<CreateGoal />} />
        <Route path="/goals/:id" element={<GoalDetail />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/badges" element={<Badges />} />
        <Route path="/presentation" element={<Slideshow />} />
      </Routes>
      {!hideNav && <BottomNav />}
    </div>
  );
}

export default App;