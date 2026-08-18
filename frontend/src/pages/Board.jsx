import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getGoals } from '../services/goalService.js';
import GoalCard from '../components/GoalCard.jsx';

function Board() {
  const [goals, setGoals] = useState([]);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const fetchGoals = () => {
    if (!token) return;
    getGoals().then((res) => setGoals(res.data));
  };

  useEffect(() => {
    fetchGoals();
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5">
        <p className="text-center text-on-surface-variant mb-4">
          Connecte-toi pour voir tes objectifs.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="h-12 px-8 bg-primary-container text-white rounded-full font-semibold"
        >
          Se connecter
        </button>
      </div>
    );
  }
  

  return (
    <div className="px-5 pt-6 pb-28">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary">Mes objectifs</h1>
         <p className="text-sm text-outline mt-1">
    Clique sur un objectif pour le détailler, ou affiche ses étapes pour avancer rapidement.
  </p>
        <Link
          to="/goals/new"
          className="w-10 h-10 bg-primary-container text-white rounded-full flex items-center justify-center shadow-lg"
        >
          <span className="material-symbols-outlined">add</span>
        </Link>
      </div>

      {goals.length === 0 && (
        <div className="flex flex-col items-center justify-center mt-20 text-center">
          <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">
            target
          </span>
          <h2 className="text-lg font-semibold text-on-surface mb-2">
            Aucun objectif pour l'instant
          </h2>
          <p className="text-sm text-outline mb-6">
            Commence par créer ton premier objectif !
          </p>
          <Link
            to="/goals/new"
            className="h-12 px-8 bg-primary-container text-white rounded-full font-semibold pill-button flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            Créer un objectif
          </Link>
        </div>
      )}

      {goals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onUpdate={fetchGoals} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Board;