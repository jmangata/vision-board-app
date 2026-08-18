import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

function GoalCard({ goal, onUpdate }) {
  const [expanded, setExpanded] = useState(false);

  const progress = goal.steps?.length
    ? Math.round((goal.steps.filter((s) => s.isCompleted).length / goal.steps.length) * 100)
    : 0;

  const handleToggleStep = async (stepId) => {
    try {
      await api.patch(`/steps/${stepId}/toggle`);
      onUpdate();
    } catch (err) {
      console.error('Erreur lors du changement de statut', err);
    }
  };

  return (
    <div className="card p-4 flex flex-col gap-3 hover:shadow-lg transition-shadow bg-surface-container-lowest rounded-xl">
      <Link to={`/goals/${goal.id}`} className="block">
        <div className="w-full aspect-[4/3] bg-surface-container rounded-xl overflow-hidden flex items-center justify-center">
          {goal.imageUrl ? (
            <img src={goal.imageUrl} alt={goal.title} className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-4xl text-outline-variant">image</span>
          )}
        </div>
        <div>
          <span className="inline-block px-2 py-1 bg-primary-container/10 text-primary-container text-xs font-semibold rounded-full mb-1">
            {goal.category?.name}
          </span>
          <h2 className="font-semibold text-on-surface leading-tight">{goal.title}</h2>
        </div>
      </Link>

      <div className="mt-auto">
        <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-container transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-outline">{progress}%</p>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-primary-container font-medium"
          >
            {expanded ? 'Masquer les étapes' : 'Voir les étapes'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-2 space-y-2 border-t border-surface-variant/30 pt-3">
          {goal.steps?.length === 0 && (
            <p className="text-xs text-outline">Aucune étape pour cet objectif.</p>
          )}
          {goal.steps?.map((step) => (
            <div
              key={step.id}
              onClick={() => handleToggleStep(step.id)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <span
                className={`material-symbols-outlined text-lg ${
                  step.isCompleted ? 'text-primary-container' : 'text-outline'
                }`}
              >
                {step.isCompleted ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <span
                className={`text-sm flex-1 ${
                  step.isCompleted ? 'line-through text-outline' : 'text-on-surface'
                }`}
              >
                {step.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GoalCard;
