// GoalCard.jsx : carte affichant un objectif avec son image, sa catégorie,
// sa barre de progression et ses étapes (pliables).
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

function GoalCard({ goal, onUpdate, featured = false }) {
  // Contrôle l'affichage du bloc d'étapes de l'objectif.
  const [expanded, setExpanded] = useState(false);

  // Pourcentage de progression calculé à partir des étapes terminées.
  const progress = goal.steps?.length
    ? Math.round((goal.steps.filter((s) => s.isCompleted).length / goal.steps.length) * 100)
    : 0;

  // Bascule l'état terminé/en cours d'une étape puis rafraîchit les données parentes.
  const handleToggleStep = async (stepId) => {
    try {
      await api.patch(`/steps/${stepId}/toggle`);
      onUpdate();
    } catch (err) {
      console.error('Erreur lors du changement de statut', err);
    }
  };

  return (
    <article className={`overflow-hidden rounded-xl bg-surface-container-lowest shadow-card ${featured || expanded ? 'col-span-2 md:col-span-1' : ''}`}>
      <Link to={`/goals/${goal.id}`} className="block">
        <div className={`relative w-full overflow-hidden bg-surface-container ${featured ? 'h-48' : 'h-40'} md:aspect-[4/3] md:h-auto`}>
          {goal.imageUrl ? (
            <img src={goal.imageUrl} alt={goal.title} className="h-full w-full object-cover" />
          ) : (
            <span className="material-symbols-outlined flex h-full items-center justify-center text-4xl text-outline-variant">image</span>
          )}
          {goal.category?.name && (
            <span
              className="absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-medium text-white shadow-soft"
              style={{ backgroundColor: goal.category.color || '#2e5797' }}
            >
              {goal.category.name}
            </span>
          )}
        </div>
        <div className={featured ? 'p-4' : 'p-3.5'}>
          <h2 className={`${featured ? 'text-lg' : 'text-sm'} font-semibold leading-snug text-on-surface ${featured ? '' : 'line-clamp-2 min-h-[2.5rem]'}`}>
            {goal.title}
          </h2>
          {featured && <p className="mt-1.5 text-xs text-outline">{progress}% réalisé</p>}
          <div className={`${featured ? 'mt-3' : 'mt-3.5'} h-1.5 w-full overflow-hidden rounded-full bg-surface-container`}>
            <div className="h-full rounded-full bg-primary-container transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between border-t border-surface-variant/30 px-3.5 py-3 text-xs font-semibold text-primary-container"
        aria-expanded={expanded}
      >
        <span>{expanded ? 'Masquer les étapes' : `Voir les étapes (${goal.steps?.length || 0})`}</span>
        <span className="material-symbols-outlined text-lg">{expanded ? 'expand_less' : 'expand_more'}</span>
      </button>

      {expanded && (
        <div className="space-y-2 border-t border-surface-variant/30 p-3">
          {goal.steps?.length === 0 && <p className="text-xs text-outline">Aucune étape pour cet objectif.</p>}
          {goal.steps?.map((step) => (
            <button key={step.id} type="button" onClick={() => handleToggleStep(step.id)} className="flex w-full items-center gap-3 text-left">
              <span className={`material-symbols-outlined text-lg ${step.isCompleted ? 'text-primary-container' : 'text-outline'}`}>
                {step.isCompleted ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <span className={`flex-1 text-sm ${step.isCompleted ? 'line-through text-outline' : 'text-on-surface'}`}>{step.title}</span>
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

export default GoalCard;
