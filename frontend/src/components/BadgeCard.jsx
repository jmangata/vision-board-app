// BadgeCard.jsx : affiche un badge avec son icône, son nom et sa description.
// La carte est grisée et opacifiée si le badge n'a pas encore été gagné.

// Correspondance entre les identifiants d'icônes internes et les noms Material Symbols.
const iconMap = {
  flag: 'flag',
  trophy: 'emoji_events',
  zap: 'bolt',
  calendar: 'calendar_month',
  compass: 'explore',
};

function BadgeCard({ badge, earned }) {
  return (
    <div
      className={`card p-5 flex flex-col items-center text-center transition-all ${
        earned ? '' : 'opacity-40 grayscale'
      }`}
    >
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${
          earned ? 'bg-primary-container shadow-progress' : 'bg-surface-container'
        }`}
      >
        <span
          className={`material-symbols-outlined text-2xl ${
            earned ? 'text-white' : 'text-outline'
          }`}
        >
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
}

export default BadgeCard;
