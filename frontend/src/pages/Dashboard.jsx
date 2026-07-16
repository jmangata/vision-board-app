import { useEffect, useState } from 'react';
import api from '../services/api.js';

function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then((res) => setStats(res.data));
  }, []);

  if (!stats) return <p className="p-5">Chargement...</p>;

  return (
    <div className="px-5 pt-6">
      <h1 className="text-2xl font-bold text-primary mb-6">Tableau de bord</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-container-low p-4 rounded-xl">
          <p className="text-xs text-outline mb-1">Objectifs totaux</p>
          <p className="text-2xl font-bold text-primary">{stats.totalGoals}</p>
        </div>
        <div className="bg-surface-container-low p-4 rounded-xl">
          <p className="text-xs text-outline mb-1">Terminés</p>
          <p className="text-2xl font-bold text-primary">{stats.completedGoals}</p>
        </div>
        <div className="bg-surface-container-low p-4 rounded-xl">
          <p className="text-xs text-outline mb-1">En cours</p>
          <p className="text-2xl font-bold text-primary">{stats.activeGoals}</p>
        </div>
        <div className="bg-surface-container-low p-4 rounded-xl">
          <p className="text-xs text-outline mb-1">Complétion</p>
          <p className="text-2xl font-bold text-primary">{stats.completionRate}%</p>
        </div>
      </div>
      <div className="mt-6 bg-surface-container-lowest p-4 rounded-xl shadow-soft">
        <p className="text-sm text-outline">Badges obtenus</p>
        <p className="text-3xl font-bold text-primary mt-1">{stats.totalBadges}</p>
      </div>
    </div>
  );
}

export default Dashboard;