import { Home, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useThemeStore } from '../stores/themeStore';

export default function Breadcrumb() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useThemeStore();

  const pathMap: Record<string, string> = {
    dashboard: 'Dashboard',
    dealers: 'Dealers',
    tables: 'Tables',
    assignments: 'Assignments',
    breaks: 'Breaks',
    analytics: 'Analytics',
    settings: 'Settings',
  };

  const paths = location.pathname.split('/').filter(Boolean);
  const currentPath = paths[0];
  
  return (
    <div className="flex items-center space-x-2 mb-6">
      <button
        onClick={() => navigate('/dashboard')}
        className={`p-1.5  transition-all ${isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-900'}`}
      >
        <Home className="w-4 h-4" />
      </button>
      
      <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
      <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
        Dashboard
      </span>
      
      {currentPath && currentPath !== 'dashboard' && (
        <>
          <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
          <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {pathMap[currentPath] || currentPath}
          </span>
        </>
      )}
    </div>
  );
}
