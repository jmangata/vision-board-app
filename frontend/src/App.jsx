import { Routes, Route, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Board from './pages/Board.jsx';
import CreateGoal from './pages/CreateGoal.jsx';
import GoalDetail from './pages/GoalDetail.jsx';
import Dashboard from './pages/Dashboard.jsx';

function App() {
  const location = useLocation();
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
      </Routes>
      {!hideNav && <BottomNav />}
    </div>
  );
}

export default App;