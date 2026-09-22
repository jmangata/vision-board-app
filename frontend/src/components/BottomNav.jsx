// BottomNav.jsx : barre de navigation fixe en bas de l'écran.
// Elle met en évidence l'onglet actif en comparant le chemin courant avec la route de chaque onglet.
import { Link, useLocation } from 'react-router-dom';

function BottomNav() {
  const location = useLocation();
  // Liste des onglets principaux avec leur icône Material Symbol et leur chemin.
  const tabs = [
    { path: '/', label: 'Board', desktopLabel: 'Objectifs', icon: 'grid_view' },
    { path: '/dashboard', label: 'Stats', desktopLabel: 'Statistiques', icon: 'auto_graph' },
    { path: '/badges', label: 'Badges', desktopLabel: 'Badges', icon: 'military_tech' },
    { path: '/profile', label: 'Profil', desktopLabel: 'Profil', icon: 'person' },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 flex h-20 w-full max-w-md -translate-x-1/2 items-center justify-around border-t border-surface-variant/30 bg-surface-container-lowest px-5 pb-1 md:h-20 md:max-w-5xl md:rounded-t-2xl md:px-8 md:shadow-card">
      {tabs.map((tab) => {
        const active = location.pathname === tab.path;
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`flex min-w-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors md:h-14 md:min-w-32 md:rounded-2xl md:text-sm md:font-semibold ${active ? 'text-primary md:bg-on-primary-container/30' : 'text-outline md:hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined text-[23px] md:text-[26px]" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{tab.icon}</span>
            <span className="md:hidden">{tab.label}</span>
            <span className="hidden md:inline">{tab.desktopLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default BottomNav;