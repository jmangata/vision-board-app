import { Link, useLocation } from 'react-router-dom';

function BottomNav() {
  const location = useLocation();
  const tabs = [
    { path: '/', label: 'Board', icon: 'grid_view' },
    { path: '/dashboard', label: 'Stats', icon: 'bar_chart' },
    { path: '/badges', label: 'Badges', icon: 'emoji_events' },
    { path: '/profile', label: 'Profile', icon: 'person' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-surface-container-lowest border-t border-surface-variant/30 px-6 py-3 flex justify-between items-center z-50">
      {tabs.map((tab) => {
        const active = location.pathname === tab.path;
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`flex flex-col items-center gap-1 text-xs font-medium ${
              active ? 'text-primary-container' : 'text-outline'
            }`}
          >
            <span className="material-symbols-outlined text-2xl">{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default BottomNav;