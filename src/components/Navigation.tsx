import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { Home, Users, Table2, Coffee, Shuffle, LogOut, Settings, Shield, BarChart3, Search, ChevronLeft, ChevronRight, Moon, Sun, Gamepad2 } from 'lucide-react';
import { getDatabase } from '../utils/database';

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allMembers, setAllMembers] = useState<any[]>([]);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    const db = await getDatabase();
    const employees = db.tables.get('Employees') || [];
    const dealers = db.tables.get('Dealers') || [];
    const membersWithImages = employees.filter((e: any) => e.id !== currentUser?.id).map((emp: any) => {
      const dealer = dealers.find((d: any) => d.employeeId === emp.id);
      return { ...emp, profileImage: dealer?.profileImage };
    }).sort((a: any, b: any) => {
      if (a.profileImage && !b.profileImage) return -1;
      if (!a.profileImage && b.profileImage) return 1;
      return 0;
    });
    setAllMembers(membersWithImages);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/assignments', icon: Shuffle, label: 'Assignments' },
    { path: '/dealers', icon: Users, label: 'Dealers' },
    { path: '/tables', icon: Table2, label: 'Tables' },
    { path: '/breaks', icon: Coffee, label: 'Breaks' },
    { path: '/games', icon: Gamepad2, label: 'Manage Games' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  const filteredNavItems = navItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <nav className={`fixed left-0 top-0 h-full ${isDark ? 'bg-black border-slate-800' : 'bg-white border-gray-200'} border-r z-50 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex flex-col h-full">
        {/* Header with Logo */}
        <div className={`p-4 border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center space-x-3">
                <img src="/images/bga.png" alt="TableFlo" className="h-10" />
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`p-2  transition-all ${isDark ? 'hover:bg-slate-900 text-white' : 'hover:bg-gray-100 text-gray-900'}`}
            >
              {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>
        </div>

        {/* Search */}
        {!collapsed && (
          <div className="p-4">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-2  text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500' : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'} border`}
              />
            </div>
          </div>
        )}

        {/* Menu Label */}
        {!collapsed && (
          <div className="px-4 py-2">
            <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Menu</p>
          </div>
        )}

        {/* Navigation Items */}
        <div className="px-3">
          <div className="space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5  transition-all duration-200 ${
                    isActive
                      ? (isDark ? 'bg-slate-900 text-white' : 'bg-gray-200 text-gray-900')
                      : (isDark ? 'text-slate-400 hover:bg-slate-900 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
                  }`}
                  title={collapsed ? item.label : ''}
                >
                  <Icon className={`w-5 h-5 ${isActive ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-white' : 'text-gray-600')}`} />
                  {!collapsed && (
                    <span className={`font-medium text-sm ${isActive ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-white' : 'text-gray-600')}`}>{item.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* All Members Section */}
        {!collapsed && (
          <>
            <div className={`px-4 py-4 mt-4 border-t ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
              <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>All Members</p>
            </div>
            
            <div className="flex-1 px-3 overflow-y-auto">
              <div className="space-y-2">
                {allMembers.slice(0, 8).map((member) => (
                  <div key={member.id} className={`flex items-center space-x-3 px-3 py-2  transition-all cursor-pointer ${isDark ? 'hover:bg-slate-900' : 'hover:bg-gray-100'}`}>
                    <img 
                      src={member.profileImage || '/images/dealer.png'} 
                      alt={member.fullName}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{member.fullName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Settings */}
        {!collapsed && (
          <div className={`px-4 py-2 border-t ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>System</p>
          </div>
        )}

        <div className="px-3 pb-3 space-y-1">
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5  transition-all text-sm ${isDark ? 'text-white hover:bg-slate-900' : 'text-gray-900 hover:bg-gray-100'}`}
            title={collapsed ? (isDark ? 'Light Mode' : 'Dark Mode') : ''}
          >
            {isDark ? <Sun className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-900'}`} /> : <Moon className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-900'}`} />}
            {!collapsed && <span className="font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <button
            onClick={() => navigate('/settings')}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5  transition-all text-sm ${isDark ? 'text-white hover:bg-slate-900' : 'text-gray-900 hover:bg-gray-100'}`}
            title={collapsed ? 'Settings' : ''}
          >
            <Settings className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-900'}`} />
            {!collapsed && <span className="font-medium">Settings</span>}
          </button>
        </div>

        {/* User Profile */}
        <div className={`p-4 border-t ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
          {collapsed ? (
            <div className="flex justify-center">
              <img src="/images/bga.png" alt="TableFlo" className="h-8" />
            </div>
          ) : (
            <>
              <div className="px-4 py-2 mb-2">
                <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Your Account</p>
              </div>
              <div className="bg-[#FA812F] p-3">
                <div className="flex items-center space-x-3 mb-3">
                  <img 
                    src={currentUser?.profileImage || '/images/dealer.png'} 
                    alt={currentUser?.fullName}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate text-white">{currentUser?.fullName}</p>
                    <p className="text-xs truncate text-white/80">{currentUser?.role}</p>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 transition-all text-sm text-white hover:bg-black/10"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
