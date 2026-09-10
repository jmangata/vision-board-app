// Page Badges : affiche tout le catalogue de badges ; ceux débloqués
// par l'utilisateur connecté apparaissent en couleur, les autres grisés.
import { useEffect, useState } from 'react';
import { getAllBadges, getMyBadges } from '../services/badgeService.js';
import BadgeCard from '../components/BadgeCard.jsx';

function Badges() {
  const [allBadges, setAllBadges] = useState([]);
  const [earnedIds, setEarnedIds] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    getAllBadges().then((res) => setAllBadges(res.data));
    if (token) {
      // On ne garde que les IDs des badges obtenus pour un test
      // d'appartenance rapide dans le rendu (earnedIds.includes)
      getMyBadges().then((res) => {
        setEarnedIds(res.data.map((ub) => ub.badgeId));
      });
    }
  }, []);

  return (
    <div className="px-5 pt-6 pb-28">
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
