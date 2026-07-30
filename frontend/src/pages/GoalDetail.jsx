import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getGoal, deleteGoal, createStep, toggleStep } from '../services/goalService.js';

const iconMap = {
  book: 'menu_book',
  briefcase: 'work',
  'dollar-sign': 'payments',
  users: 'groups',
  heart: 'favorite',
  map: 'flight',
};

function GoalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [goal, setGoal] = useState(null);
  const [newStep, setNewStep] = useState('');

  const fetchGoal = () => {
    getGoal(id).then((res) => setGoal(res.data));
  };

  useEffect(() => {
    fetchGoal();
  }, [id]);

 const handleAddStep = async (e) => {
  e.preventDefault();
 
  const title = newStep.trim();
  if (!title) return;
 
  const formattedTitle = title.charAt(0).toUpperCase() + title.slice(1);
 
  await createStep(id, formattedTitle);
  setNewStep('');
  fetchGoal();
};

  const handleToggle = async (stepId) => {
    await toggleStep(stepId);
    fetchGoal();
  };

  const handleDelete = async () => {
    await deleteGoal(id);
    navigate('/');
  };

  if (!goal) return <p className="p-5">Chargement...</p>;

  const completed = goal.steps.filter((s) => s.isCompleted).length;
  const total = goal.steps.length;
  const progress = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md h-16 flex justify-between items-center px-5">
        <Link to="/" className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center text-primary">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="text-lg font-semibold text-primary">Détail de l'objectif</h1>
        <button onClick={handleDelete} className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center text-error">
          <span className="material-symbols-outlined">delete</span>
        </button>
      </header>

      <main className="mt-16 px-5">
        <div className="relative w-full h-64 overflow-hidden bg-surface-container rounded-3xl shadow-lg">
          {goal.imageUrl ? (
            <img src={goal.imageUrl} alt={goal.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-6xl text-outline-variant">landscape</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        <div className="-mt-10 relative z-10">
          <div className="card p-5">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="bg-primary-container text-on-primary rounded-full px-3 py-1 text-xs font-semibold inline-block mb-2">
                  {goal.category?.name}
                </span>
                <h2 className="text-xl font-bold text-on-surface">{goal.title}</h2>
              </div>
              <div className="bg-surface-container-low text-primary p-2 rounded-lg">
                <span className="material-symbols-outlined">
                  {iconMap[goal.category?.icon] || 'label'}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between items-end mb-1">
                <p className="text-sm font-semibold text-primary">Progression globale</p>
                <p className="text-2xl font-bold text-primary">{progress}%</p>
              </div>
              <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-container shadow-progress transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <section className="px-5 mt-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-on-surface">Étapes</h3>
            <span className="text-xs text-outline">{completed} sur {total} étape(s) terminée(s)</span>
          </div>
    <p className="text-xs text-outline mb-3">
  Clique sur une étape pour la valider. Ajoute des étapes petites et actionnables.
</p>
          <form onSubmit={handleAddStep} className="flex gap-2 mb-4">
            <input
              placeholder="Ajouter une étape"
              className="flex-1 input-field"
              value={newStep}
              onChange={(e) => setNewStep(e.target.value)}
            />
            <button className="w-12 h-14 bg-primary-container text-white rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined">add</span>
            </button>
          </form>

          <div className="space-y-3">
            {goal.steps.map((step) => (
              <div
                key={step.id}
                onClick={() => handleToggle(step.id)}
                className="flex items-center p-4 bg-surface-container-lowest rounded-xl shadow-soft border border-transparent hover:border-primary-container transition-all cursor-pointer"
              >
                <div className={`w-6 h-6 rounded-md mr-4 flex items-center justify-center ${
                  step.isCompleted ? 'bg-primary text-on-primary' : 'border-2 border-outline-variant'
                }`}>
                  {step.isCompleted && <span className="material-symbols-outlined text-sm">check</span>}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${step.isCompleted ? 'text-outline line-through' : 'text-on-surface'}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-outline-variant">
                    {step.isCompleted ? `Terminée le ${new Date(step.completedAt).toLocaleDateString('fr-FR')}` : 'En cours'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default GoalDetail;