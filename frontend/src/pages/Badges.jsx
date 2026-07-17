 import { useEffect, useState } from 'react';
import { getAllBadges, getMyBadges } from '../services/badgeService.js';

const iconMap = {
  flag: 'flag',
  trophy: 'emoji_events',
  zap: 'bolt',
  calendar: 'calendar_month',
  compass: 'explore',
};

function Badges() {
  const [allBadges, setAllBadges] = useState([]);
  const [earnedIds, setEarnedIds] = useState([]);

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
    <div className="px-5 pt-6 pb-28">
      <h1 className="text-2xl font-bold text-primary mb-6">Badges</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {allBadges.map((badge) => {
          const earned = earnedIds.includes(badge.id);
          return (
            <div
              key={badge.id}
              className={`card p-5 flex flex-col items-center text-center transition-all ${
                earned ? '' : 'opacity-40 grayscale'
              }`}
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${
                earned ? 'bg-primary-container shadow-progress' : 'bg-surface-container'
              }`}>
                <span className={`material-symbols-outlined text-2xl ${earned ? 'text-white' : 'text-outline'}`}>
                  {iconMap[badge.icon] || 'star'}
                </span>
              </div>
              <h3 className="font-semibold text-on-surface text-sm">{badge.name}</h3>
              <p className="text-xs text-outline mt-1">{badge.description}</p>
              {earned && (
                <span className="mt-2 text-xs font-semibold text-secondary">Obtenu ✓</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Badges;
