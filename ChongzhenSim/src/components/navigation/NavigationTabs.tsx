import { useNavigationStore, type NavigationView } from '@/store/navigationStore';
import { useThemeStore } from '@/store/themeStore';

interface NavItem {
  key: NavigationView;
  label: string;
  description: string;
}

const navItems: NavItem[] = [
  { key: 'court', label: '皇极殿', description: '大朝会与剧本事件' },
  { key: 'officials', label: '众正盈朝', description: '大明官职体系' },
  { key: 'policy', label: '国策树', description: '国策决策树' },
  { key: 'map', label: '坤舆万国全图', description: '天下舆图' },
  { key: 'military', label: '军事', description: '将领与兵力' },
];

export function NavigationTabs() {
  const { currentView, setView } = useNavigationStore();
  const { theme } = useThemeStore();

  return (
    <div className="navigation-tabs">
      {navItems.map((item) => {
        const isActive = currentView === item.key;
        return (
          <button
            key={item.key}
            onClick={() => setView(item.key)}
            className={`nav-tab ${isActive ? 'nav-tab-active' : ''}`}
            title={item.description}
          >
            <span className="nav-tab-label">{item.label}</span>
            {isActive && <span className="nav-tab-indicator" />}
          </button>
        );
      })}
    </div>
  );
}
