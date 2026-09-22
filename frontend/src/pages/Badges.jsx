// Badges.jsx : page listant tous les badges disponibles.
// Elle distingue visuellement les badges obtenus par l'utilisateur connecté.
import { useEffect, useState } from 'react';
import { getAllBadges, getMyBadges } from '../services/badgeService.js';
import BadgeCard from '../components/BadgeCard.jsx';

function Badges() {
  const [allBadges, setAllBadges] = useState([]);
  // Identifiants des badges déjà gagnés par l'utilisateur courant.
  const [earnedIds, setEarnedIds] = useState([]);

  // Chargement initial : récupère tous les badges puis ceux de l'utilisateur (si authentifié).
  useEffect(() => {
    const token = localStorage.getItem('token');
    getAllBadges().then((res) => setAllBadges(res.data));
    if (token) {
      getMyBadges().then((res) => {
        setEarnedIds(res.data.map((ub) => ub.badgeId));
      });
    }
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-28 pt-6 md:px-8 md:pt-8">
      <h1 className="text-2xl font-bold text-primary mb-6">Badges</h1>
       <p className="text-sm text-outline mt-1">
    Atteins des objectifs et crée des habitudes pour débloquer de nouveaux badges.
  </p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {allBadges.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} earned={earnedIds.includes(badge.id)} />
        ))}
      </div>
    </div>
  );
}

export default Badges;
