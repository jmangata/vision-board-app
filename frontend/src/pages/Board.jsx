// Board.jsx : page d'accueil affichant la vision board de l'utilisateur.
// Elle récupère les objectifs de l'utilisateur connecté et propose de créer le premier objectif.
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getGoals } from '../services/goalService.js';
import api from '../services/api.js';
import GoalCard from '../components/GoalCard.jsx';

const visibleCategoryNames = ['Sport', 'Musique', 'Voyage', 'Finance', 'Lecture'];

const welcomeMessages = [
  (firstname) => `Ravi de te revoir, ${firstname} ! Prêt à avancer vers tes objectifs ?`,
  (firstname) => `Bonjour ${firstname} ! Chaque petit pas te rapproche de ta vision.`,
  (firstname) => `Heureux de te retrouver, ${firstname} ! Faisons de cette journée une réussite.`,
  (firstname) => `Bienvenue ${firstname} ! Tes ambitions méritent toute ton énergie.`,
  (firstname) => `Content de te revoir, ${firstname} ! Quel rêve vas-tu faire avancer aujourd’hui ?`,
  (firstname) => `C’est un plaisir de te retrouver, ${firstname} ! Continue sur cette belle lancée.`,
];

function Board() {
  const [goals, setGoals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [welcome, setWelcome] = useState(() => {
    const storedWelcome = localStorage.getItem('pendingWelcome');
    if (!storedWelcome) return null;
    try {
      const parsedWelcome = JSON.parse(storedWelcome);
      if (!parsedWelcome.firstname) return null;
      return { ...parsedWelcome, variant: Number.isInteger(parsedWelcome.variant) ? parsedWelcome.variant : 0 };
    } catch {
      return null;
    }
  });
  // Vérifie la présence du token pour afficher soit le contenu, soit un écran de connexion.
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  // Charge les objectifs depuis l'API, protégé par la présence du token.
  const fetchGoals = () => {
    if (!token) return;
    getGoals().then((res) => setGoals(res.data));
  };

  // Recharge les objectifs au montage ou si le token change.
  useEffect(() => {
    fetchGoals();
    api.get('/categories').then((res) => {
      const visibleCategories = visibleCategoryNames
        .map((name) => res.data.find((category) => category.name === name))
        .filter(Boolean);
      setCategories(visibleCategories);
    });
  }, [token]);

  useEffect(() => {
    if (welcome) localStorage.removeItem('pendingWelcome');
  }, [welcome]);

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

  const filteredGoals = activeCategory === 'all'
    ? goals
    : activeCategory === 'other'
      ? goals.filter((goal) => !visibleCategoryNames.includes(goal.category?.name))
      : goals.filter((goal) => goal.category?.id === activeCategory);

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-background pb-28 md:max-w-none">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-surface-container-lowest px-5 shadow-soft md:hidden">
        <button type="button" className="flex h-10 w-10 items-center text-primary" aria-label="Ouvrir le menu">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 className="text-xl font-bold text-primary">Vision Board</h1>
        <Link to="/goals/new" className="flex h-10 w-10 items-center justify-end text-primary" aria-label="Ajouter un objectif">
          <span className="material-symbols-outlined">add_circle</span>
        </Link>
      </header>

      <header className="hidden items-start justify-between px-8 pt-8 md:flex">
        <div>
          <h1 className="text-2xl font-bold text-primary">Mes objectifs</h1>
          <p className="mt-1 text-sm text-outline">Clique sur un objectif pour le détailler, ou affiche ses étapes pour avancer rapidement.</p>
        </div>
        <Link to="/goals/new" className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-white shadow-lg" aria-label="Ajouter un objectif">
          <span className="material-symbols-outlined">add</span>
        </Link>
      </header>

      <main className="px-5 pt-7 md:px-8 md:pt-6">
        {welcome && (
          <div className="relative mb-7 overflow-hidden rounded-2xl bg-primary-container px-5 py-5 text-white shadow-lg md:max-w-2xl">
            <div className="relative z-10 pr-8">
              <p className="text-lg font-bold">Un nouveau pas vers ta vision</p>
              <p className="mt-1 text-sm leading-5 text-white/85">
                {welcomeMessages[welcome.variant % welcomeMessages.length](welcome.firstname)}
              </p>
            </div>
            <span className="material-symbols-outlined absolute -bottom-3 -right-2 text-7xl text-white/10">auto_awesome</span>
            <button type="button" onClick={() => setWelcome(null)} className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white" aria-label="Fermer le message d'accueil">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        )}

        <div className="-mx-5 mb-7 flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-hide md:mx-0 md:px-0">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`h-10 shrink-0 rounded-full px-6 text-sm font-semibold transition-colors ${activeCategory === 'all' ? 'bg-primary-container text-white' : 'bg-surface-container-low text-on-surface-variant'}`}
          >
            Tout
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={`h-10 shrink-0 rounded-full px-6 text-sm font-semibold transition-colors ${activeCategory === category.id ? 'bg-primary-container text-white' : 'bg-surface-container-low text-on-surface-variant'}`}
            >
              {category.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setActiveCategory('other')}
            className={`h-10 shrink-0 rounded-full px-6 text-sm font-semibold transition-colors ${activeCategory === 'other' ? 'bg-primary-container text-white' : 'bg-surface-container-low text-on-surface-variant'}`}
          >
            Autre
          </button>
        </div>

        {goals.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-20 text-center">
            <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">target</span>
            <h2 className="text-lg font-semibold text-on-surface mb-2">Aucun objectif pour l'instant</h2>
            <p className="text-sm text-outline mb-6">Commence par créer ton premier objectif !</p>
            <Link to="/goals/new" className="h-12 px-8 bg-primary-container text-white rounded-full font-semibold pill-button flex items-center gap-2">
              <span className="material-symbols-outlined">add</span>
              Créer un objectif
            </Link>
          </div>
        )}

        {filteredGoals.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:hidden">
            {filteredGoals.map((goal, index) => (
              <GoalCard key={goal.id} goal={goal} onUpdate={fetchGoals} featured={index === 0} />
            ))}
          </div>
        )}

        {filteredGoals.length > 0 && (
          <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
            {filteredGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onUpdate={fetchGoals} />
            ))}
          </div>
        )}

        {goals.length > 0 && filteredGoals.length === 0 && (
          <p className="py-16 text-center text-sm text-outline">Aucun objectif dans cette catégorie.</p>
        )}
      </main>
    </div>
  );
}

export default Board;