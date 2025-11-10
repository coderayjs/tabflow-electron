import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { useNavigate } from 'react-router-dom';
import { Users, Table2, Coffee, Shuffle, TrendingUp, Clock, AlertCircle, CheckCircle2, Calendar } from 'lucide-react';
import GlassCard from './GlassCard';
import Breadcrumb from './Breadcrumb';

export default function Dashboard() {
  const { currentUser } = useAuthStore();
  const { isDark } = useThemeStore();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentDealers, setCurrentDealers] = useState<any[]>([]);
  const [availableDealers, setAvailableDealers] = useState<any[]>([]);
  const [dealersOnBreak, setDealersOnBreak] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadDealerData();
    const interval = setInterval(() => {
      loadDealerData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadDealerData = async () => {
    const { getDatabase } = await import('../utils/database');
    const db = await getDatabase();
    const dealers = db.tables.get('Dealers') || [];
    const employees = db.tables.get('Employees') || [];
    const assignments = db.tables.get('Assignments') || [];
    const breaks = db.tables.get('BreakRecords') || [];
    const tables = db.tables.get('Tables') || [];

    const dealersWithEmployees = dealers.map((d: any) => ({
      ...d,
      employee: employees.find((e: any) => e.id === d.employeeId)
    }));

    // Current dealers (dealing)
    const current = dealersWithEmployees
      .filter((d: any) => d.status === 'Dealing')
      .map((d: any) => {
        const assignment = assignments.find((a: any) => a.dealerId === d.id && a.isCurrent);
        const table = assignment ? tables.find((t: any) => t.id === assignment.tableId) : null;
        return { ...d, table };
      })
      .slice(0, 5);

    // Available dealers (ready for next rotation)
    const available = dealersWithEmployees
      .filter((d: any) => d.status === 'Available')
      .slice(0, 5);

    // Dealers on break
    const onBreak = breaks
      .filter((b: any) => !b.endTime)
      .map((b: any) => {
        const dealer = dealersWithEmployees.find((d: any) => d.id === b.dealerId);
        return { ...dealer, breakRecord: b };
      })
      .slice(0, 3);

    setCurrentDealers(current);
    setAvailableDealers(available);
    setDealersOnBreak(onBreak);

    // Load recent activity from audit logs
    const auditLogs = db.tables.get('AuditLogs') || [];
    const activities = auditLogs
      .filter((log: any) => log && log.actionType && log.timestamp)
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 4)
      .map((log: any) => {
        const elapsed = Math.floor((new Date().getTime() - new Date(log.timestamp).getTime()) / 60000);
        const timeAgo = elapsed < 1 ? 'Just now' : elapsed < 60 ? `${elapsed} min ago` : `${Math.floor(elapsed / 60)}h ago`;
        
        let icon = CheckCircle2;
        let type = 'success';
        const actionType = String(log.actionType || '');
        if (actionType.includes('Break')) {
          icon = Coffee;
          type = 'info';
        } else if (actionType.includes('Rotation') || actionType.includes('Pushed')) {
          icon = Shuffle;
          type = 'success';
        } else if (actionType.includes('Alert')) {
          icon = AlertCircle;
          type = 'warning';
        }

        const dealer = log.relatedEntityType === 'Dealer' ? dealersWithEmployees.find((d: any) => d.id === log.relatedEntityId) : null;

        return {
          type,
          message: log.description || actionType,
          time: timeAgo,
          icon,
          dealer
        };
      });

    setRecentActivity(activities);
  };

  const stats = {
    totalDealers: 24,
    activeTables: 18,
    dealersOnBreak: 3,
    pendingRotations: 2
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'} p-6`}>
      <div className="max-w-7xl mx-auto space-y-6">
        <Breadcrumb />
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Dashboard</h1>
            <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>Welcome back, {currentUser?.firstName}. Here's your casino overview.</p>
          </div>
          <GlassCard className="px-4 py-3" hover={false}>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-[#FA812F]" />
                <div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} font-mono`}>
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Local Time</p>
                </div>
              </div>
              <div className={`h-10 w-px ${isDark ? 'bg-white/10' : 'bg-gray-300'}`}></div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-[#FA812F]" />
                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{currentTime.toLocaleDateString('en-US', { weekday: 'long' })}</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard onClick={() => navigate('/dealers')} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 ${isDark ? 'bg-blue-500/10' : 'bg-blue-100'} `}>
                <Users className={`w-5 h-5 ${isDark ? 'text-white' : 'text-blue-600'}`} />
              </div>
              <TrendingUp className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-gray-600'}`} />
            </div>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.totalDealers}</p>
            <p className={`${isDark ? 'text-slate-400' : 'text-gray-600'} text-xs mt-0.5`}>Total Dealers</p>
          </GlassCard>

          <GlassCard onClick={() => navigate('/tables')} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-100'} `}>
                <Table2 className={`w-5 h-5 ${isDark ? 'text-white' : 'text-emerald-600'}`} />
              </div>
              <TrendingUp className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-gray-600'}`} />
            </div>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.activeTables}</p>
            <p className={`${isDark ? 'text-slate-400' : 'text-gray-600'} text-xs mt-0.5`}>Active Tables</p>
          </GlassCard>

          <GlassCard onClick={() => navigate('/breaks')} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 ${isDark ? 'bg-amber-500/10' : 'bg-amber-100'} `}>
                <Coffee className={`w-5 h-5 ${isDark ? 'text-white' : 'text-amber-600'}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.dealersOnBreak}</p>
            <p className={`${isDark ? 'text-slate-400' : 'text-gray-600'} text-xs mt-0.5`}>On Break</p>
          </GlassCard>

          <GlassCard onClick={() => navigate('/assignments')} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 ${isDark ? 'bg-purple-500/10' : 'bg-purple-100'} `}>
                <Shuffle className={`w-5 h-5 ${isDark ? 'text-white' : 'text-purple-600'}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.pendingRotations}</p>
            <p className={`${isDark ? 'text-slate-400' : 'text-gray-600'} text-xs mt-0.5`}>Rotations Due</p>
          </GlassCard>
        </div>

        {/* Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Current Dealers */}
          <GlassCard className="p-6" hover={false}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Current Dealers</h3>
            <div className="space-y-3">
              {currentDealers.length > 0 ? currentDealers.map((dealer) => (
                <div key={dealer.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={dealer.profileImage || '/images/dealer.png'} 
                      alt={dealer.employee?.fullName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{dealer.employee?.fullName}</p>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{dealer.table?.tableNumber || 'No table'}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300">Active</span>
                </div>
              )) : (
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>No active dealers</p>
              )}
            </div>
          </GlassCard>

          {/* Next Dealers */}
          <GlassCard className="p-6" hover={false}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Next Dealers</h3>
            <div className="space-y-3">
              {availableDealers.length > 0 ? availableDealers.map((dealer) => (
                <div key={dealer.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={dealer.profileImage || '/images/dealer.png'} 
                      alt={dealer.employee?.fullName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{dealer.employee?.fullName}</p>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Level {dealer.seniorityLevel}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300">Ready</span>
                </div>
              )) : (
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>No available dealers</p>
              )}
            </div>
          </GlassCard>

          {/* Dealers on Break */}
          <GlassCard className="p-6" hover={false}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Dealers on Break</h3>
            <div className="space-y-3">
              {dealersOnBreak.length > 0 ? dealersOnBreak.map((dealer) => {
                const elapsed = Math.floor((new Date().getTime() - new Date(dealer.breakRecord.startTime).getTime()) / 60000);
                const remaining = dealer.breakRecord.expectedDurationMinutes - elapsed;
                return (
                  <div key={dealer.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={dealer.profileImage || '/images/dealer.png'} 
                        alt={dealer.employee?.fullName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{dealer.employee?.fullName}</p>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{remaining > 0 ? `${remaining} min remaining` : 'Overdue'}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-300">{dealer.breakRecord.breakType}</span>
                  </div>
                );
              }) : (
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>No dealers on break</p>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>Quick Actions</h2>
            <GlassCard className="p-4" hover={false}>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate('/assignments')}
                  className="px-4 py-2 bg-[#FA812F] hover:bg-[#E6721A] text-white  flex items-center gap-2 transition-all text-sm"
                >
                  <Shuffle size={16} />
                  Manage Rotations
                </button>
                <button
                  onClick={() => navigate('/dealers')}
                  className="px-4 py-2 bg-[#FA812F] hover:bg-[#E6721A] text-white  flex items-center gap-2 transition-all text-sm"
                >
                  <Users size={16} />
                  Dealer Management
                </button>
                <button
                  onClick={() => navigate('/tables')}
                  className="px-4 py-2 bg-[#FA812F] hover:bg-[#E6721A] text-white  flex items-center gap-2 transition-all text-sm"
                >
                  <Table2 size={16} />
                  Table Configuration
                </button>
                <button
                  onClick={() => navigate('/breaks')}
                  className="px-4 py-2 bg-[#FA812F] hover:bg-[#E6721A] text-white  flex items-center gap-2 transition-all text-sm"
                >
                  <Coffee size={16} />
                  Break Management
                </button>
              </div>
            </GlassCard>
          </div>

          <div>
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>Recent Activity</h2>
            <GlassCard className="p-4" hover={false}>
              <div className="space-y-3">
                {recentActivity.length > 0 ? recentActivity.map((activity, index) => {
                  const Icon = activity.icon;
                  const colors = {
                    success: isDark ? 'text-white bg-green-500/10' : 'text-gray-700 bg-green-100',
                    info: isDark ? 'text-white bg-blue-500/10' : 'text-gray-700 bg-blue-100',
                    warning: isDark ? 'text-white bg-amber-500/10' : 'text-gray-700 bg-amber-100'
                  };
                  
                  return (
                    <div key={index} className="flex items-start space-x-2.5">
                      {activity.dealer ? (
                        <img 
                          src={activity.dealer.profileImage || '/images/dealer.png'} 
                          alt={activity.dealer.employee?.fullName}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`p-1.5  ${colors[activity.type as keyof typeof colors]}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs ${isDark ? 'text-white' : 'text-gray-900'} leading-tight`}>{activity.message}</p>
                        <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-500'} mt-0.5`}>
                          {activity.dealer && <span className="font-semibold px-1.5 py-0.5 bg-gradient-to-r from-slate-700 to-slate-800 text-white">{activity.dealer.employee?.fullName}</span>}
                          {activity.dealer && ' • '}
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  );
                }) : (
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'} text-center py-4`}>No recent activity</p>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
