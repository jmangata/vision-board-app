import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getGoals } from '../services/goalService.js';

function Board() {
  const [goals, setGoals] = useState([]);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    getGoals().then((res) => setGoals(res.data));
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5">
        <p className="text-center text-on-surface-variant mb-4">Connecte-toi pour voir tes objectifs.</p>
        <button onClick={() => navigate('/login')} className="h-12 px-8 bg-primary-container text-white rounded-full font-semibold">
          Se connecter
        </button>
      </div>
    );
  }

  const progress = (goal) => {
    if (!goal.steps.length) return 0;
    return Math.round((goal.steps.filter((s) => s.isCompleted).length / goal.steps.length) * 100);
  };

  return (
    <div className="px-5 pt-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary">Mes objectifs</h1>
        <Link to="/goals/new" className="w-10 h-10 bg-primary-container text-white rounded-full flex items-center justify-center shadow-lg">
          <span className="material-symbols-outlined">add</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {goals.map((goal) => (
          <Link
            key={goal.id}
            to={`/goals/${goal.id}`}
            className="card p-4 flex flex-col gap-3 hover:shadow-lg transition-shadow"
          >
            <div className="w-full aspect-[4/3] bg-surface-container rounded-xl overflow-hidden flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-outline-variant">image</span>
            </div>
            <div>
              <span className="inline-block px-2 py-1 bg-primary-container/10 text-primary-container text-xs font-semibold rounded-full mb-1">
                {goal.category?.name}
              </span>
              <h2 className="font-semibold text-on-surface leading-tight">{goal.title}</h2>
            </div>
            <div className="mt-auto">
              <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-container transition-all duration-500"
                  style={{ width: `${progress(goal)}%` }}
                />
              </div>
              <p className="text-xs text-outline mt-1">{progress(goal)}%</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Board;