import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { useNavigate } from 'react-router-dom';
import { Users, Table2, Coffee, Shuffle, TrendingUp, Clock, AlertCircle, CheckCircle2, Calendar, Award, Gamepad2, RotateCcw } from 'lucide-react';
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
  const [dealersForDay, setDealersForDay] = useState(0);
  const [activeTablesWithDealers, setActiveTablesWithDealers] = useState<any[]>([]);
  const [pendingRotations, setPendingRotations] = useState(0);
  const [allDealersCount, setAllDealersCount] = useState(0);
  const [allTablesCount, setAllTablesCount] = useState(0);
  const [assignmentsData, setAssignmentsData] = useState<any[]>([]);
  const [allDealers, setAllDealers] = useState<any[]>([]);
  const [pendingRotationDealers, setPendingRotationDealers] = useState<any[]>([]);

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

  const getDealerStats = (dealerId: number, assignments: any[]) => {
    const dealerAssignments = assignments.filter((a: any) => a.dealerId === dealerId);
    const totalMinutes = dealerAssignments.reduce((sum: number, a: any) => {
      if (a.endTime) {
        return sum + Math.floor((new Date(a.endTime).getTime() - new Date(a.startTime).getTime()) / 60000);
      }
      return sum + Math.floor((new Date().getTime() - new Date(a.startTime).getTime()) / 60000);
    }, 0);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const gamesCount = dealerAssignments.length;
    const timeWorked = `${hours}h${mins}m`;
    const skillRating = (85 + (dealerId % 15)).toFixed(0);
    return { skillRating, timeWorked, gamesCount };
  };

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

    // Total dealers for the day
    const today = new Date().toDateString();
    const dealersToday = dealersWithEmployees.filter((d: any) => {
      const dealerAssignments = assignments.filter((a: any) => a.dealerId === d.id);
      return dealerAssignments.some((a: any) => new Date(a.startTime).toDateString() === today);
    });
    setDealersForDay(dealersToday.length || dealersWithEmployees.length);

    // Current dealers (dealing) with table info
    const current = dealersWithEmployees
      .filter((d: any) => d.status === 'Dealing')
      .map((d: any) => {
        const assignment = assignments.find((a: any) => a.dealerId === d.id && a.isCurrent);
        const table = assignment ? tables.find((t: any) => t.id === assignment.tableId) : null;
        const stats = getDealerStats(d.id, assignments);
        const rotationTime = assignment ? Math.floor((new Date().getTime() - new Date(assignment.startTime).getTime()) / 60000) : 0;
        return { ...d, table, stats, rotationTime, assignment };
      })
      .slice(0, 5);

    // Available dealers (ready for next rotation)
    const available = dealersWithEmployees
      .filter((d: any) => d.status === 'Available')
      .map((d: any) => {
        const stats = getDealerStats(d.id, assignments);
        return { ...d, stats };
      })
      .slice(0, 5);

    // Dealers on break
    const onBreak = breaks
      .filter((b: any) => !b.endTime)
      .map((b: any) => {
        const dealer = dealersWithEmployees.find((d: any) => d.id === b.dealerId);
        const stats = dealer ? getDealerStats(dealer.id, assignments) : { skillRating: '0', timeWorked: '0h0m', gamesCount: 0 };
        const elapsed = Math.floor((new Date().getTime() - new Date(b.startTime).getTime()) / 60000);
        const remaining = b.expectedDurationMinutes - elapsed;
        return { ...dealer, breakRecord: b, stats, elapsed, remaining };
      })
      .slice(0, 5);

    // Active tables (all open tables, with or without dealers)
    const activeTables = tables
      .filter((t: any) => t.status === 'Open')
      .map((table: any) => {
        const assignment = assignments.find((a: any) => a.tableId === table.id && a.isCurrent);
        const dealer = assignment ? dealersWithEmployees.find((d: any) => d.id === assignment.dealerId) : null;
        return { ...table, currentDealer: dealer, assignment };
      });

    // Pending rotations (dealers approaching or exceeding 20 minutes)
    const pending = current.filter((d: any) => d.rotationTime >= 18);
    setPendingRotations(pending.length);
    setPendingRotationDealers(pending);

    setCurrentDealers(current);
    setAvailableDealers(available);
    setDealersOnBreak(onBreak);
    setActiveTablesWithDealers(activeTables);
    setAllDealersCount(dealersWithEmployees.length);
    setAllTablesCount(tables.filter((t: any) => t.status === 'Open').length);
    setAssignmentsData(assignments);
    setAllDealers(dealersWithEmployees);

    // Load recent activity from audit logs (last 10)
    const auditLogs = db.tables.get('AuditLogs') || [];
    const activities = auditLogs
      .filter((log: any) => log && log.actionType && log.timestamp)
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
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
    totalDealers: dealersForDay,
    totalDealersAll: allDealersCount,
    activeTables: activeTablesWithDealers.length,
    activeTablesAll: allTablesCount,
    dealersOnBreak: dealersOnBreak.length,
    dealersOnBreakAll: allDealersCount,
    pendingRotations: pendingRotations
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'} p-4`}>
      <div className="max-w-7xl mx-auto space-y-3">
        <Breadcrumb />
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>Dashboard</h1>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Welcome back, {currentUser?.firstName}. Here's your casino overview.</p>
          </div>
          {/* Redesigned Time Component */}
          <GlassCard className="px-4 py-3" hover={false}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 flex-1">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-[#FA812F]/20' : 'bg-[#FA812F]/10'}`}>
                  <Clock className="w-4 h-4 text-[#FA812F]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} font-mono tracking-tight`}>
                      {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </p>
                    <p className={`text-sm font-mono ${isDark ? 'text-slate-400' : 'text-gray-500'} font-semibold`}>
                      {String(currentTime.getSeconds()).padStart(2, '0')}
                    </p>
                  </div>
                  <p className={`text-[10px] font-medium mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}
                  </p>
                </div>
              </div>
              <div className={`h-10 w-px ${isDark ? 'bg-slate-700/50' : 'bg-gray-300'}`}></div>
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                  <Calendar className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {currentTime.toLocaleDateString('en-US', { year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Enhanced KPI Cards matching Assignments style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <GlassCard onClick={() => navigate('/dealers')} className="p-2.5" hover={true}>
            <div className="mb-1.5">
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`p-1 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                  <Users className={isDark ? 'text-slate-400' : 'text-gray-500'} size={16} />
              </div>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Total Dealers</p>
              </div>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center gap-1 mb-2`}>
                <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>{stats.totalDealers}</span>
                <span className={isDark ? 'text-slate-600' : 'text-gray-400'}>/</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-gray-200 text-gray-700'}`}>{stats.totalDealersAll}</span>
              </p>
              <div className="flex items-center -space-x-2">
                {allDealers.slice(0, 3).map((dealer) => (
                  <img
                    key={dealer.id}
                    src={dealer.profileImage || '/images/dealer.png'}
                    alt={dealer.employee?.fullName}
                    className={`w-6 h-6 rounded-full border-2 object-cover ${isDark ? 'border-slate-900' : 'border-white'}`}
                    title={dealer.employee?.fullName}
                  />
                ))}
                {allDealers.length > 3 && (
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-semibold ${isDark ? 'bg-slate-700 text-slate-300 border-slate-900' : 'bg-gray-200 text-gray-700 border-white'}`}>
                    +{allDealers.length - 3}
            </div>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard onClick={() => navigate('/tables')} className="p-2.5" hover={true}>
            <div className="mb-1.5">
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`p-1 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                  <Table2 className={isDark ? 'text-slate-400' : 'text-gray-500'} size={16} />
                </div>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Active Tables</p>
              </div>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center gap-1 mb-2`}>
                <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>{stats.activeTables}</span>
                <span className={isDark ? 'text-slate-600' : 'text-gray-400'}>/</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-gray-200 text-gray-700'}`}>{stats.activeTablesAll}</span>
              </p>
              <div className="flex items-center -space-x-2">
                {activeTablesWithDealers.filter((t: any) => t.currentDealer).slice(0, 3).map((table: any) => (
                  <img
                    key={table.id}
                    src={table.currentDealer?.profileImage || '/images/dealer.png'}
                    alt={table.currentDealer?.employee?.fullName}
                    className={`w-6 h-6 rounded-full border-2 object-cover ${isDark ? 'border-slate-900' : 'border-white'}`}
                    title={`${table.tableNumber} - ${table.currentDealer?.employee?.fullName}`}
                  />
                ))}
                {activeTablesWithDealers.filter((t: any) => t.currentDealer).length > 3 && (
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-semibold ${isDark ? 'bg-slate-700 text-slate-300 border-slate-900' : 'bg-gray-200 text-gray-700 border-white'}`}>
                    +{activeTablesWithDealers.filter((t: any) => t.currentDealer).length - 3}
                  </div>
                )}
                </div>
            </div>
          </GlassCard>

          <GlassCard onClick={() => navigate('/breaks')} className="p-2.5" hover={true}>
            <div className="mb-1.5">
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`p-1 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                  <Coffee className={isDark ? 'text-slate-400' : 'text-gray-500'} size={16} />
                </div>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>On Break</p>
              </div>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center gap-1 mb-2`}>
                <span className={isDark ? 'text-amber-400' : 'text-amber-600'}>{stats.dealersOnBreak}</span>
                <span className={isDark ? 'text-slate-600' : 'text-gray-400'}>/</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-gray-200 text-gray-700'}`}>{stats.dealersOnBreakAll}</span>
              </p>
              <div className="flex items-center -space-x-2">
                {dealersOnBreak.slice(0, 3).map((dealer) => (
                  <img
                    key={dealer.id}
                      src={dealer.profileImage || '/images/dealer.png'} 
                      alt={dealer.employee?.fullName}
                    className={`w-6 h-6 rounded-full border-2 object-cover ${isDark ? 'border-slate-900' : 'border-white'}`}
                    title={dealer.employee?.fullName}
                  />
                ))}
                {dealersOnBreak.length > 3 && (
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-semibold ${isDark ? 'bg-slate-700 text-slate-300 border-slate-900' : 'bg-gray-200 text-gray-700 border-white'}`}>
                    +{dealersOnBreak.length - 3}
                  </div>
                )}
                </div>
            </div>
          </GlassCard>

          <GlassCard onClick={() => navigate('/assignments')} className="p-2.5" hover={true}>
            <div className="mb-1.5">
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`p-1 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                  <Shuffle className={isDark ? 'text-slate-400' : 'text-gray-500'} size={16} />
                </div>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Rotations Due</p>
              </div>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                <span className={isDark ? 'text-purple-400' : 'text-purple-600'}>{stats.pendingRotations}</span>
              </p>
              <div className="flex items-center -space-x-2">
                {pendingRotationDealers.slice(0, 3).map((dealer) => (
                  <img
                    key={dealer.id}
                        src={dealer.profileImage || '/images/dealer.png'} 
                        alt={dealer.employee?.fullName}
                    className={`w-6 h-6 rounded-full border-2 object-cover ${isDark ? 'border-slate-900' : 'border-white'}`}
                    title={dealer.employee?.fullName}
                  />
                ))}
                {pendingRotationDealers.length > 3 && (
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-semibold ${isDark ? 'bg-slate-700 text-slate-300 border-slate-900' : 'bg-gray-200 text-gray-700 border-white'}`}>
                    +{pendingRotationDealers.length - 3}
                  </div>
              )}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Quick Actions & Recent Activity */}
        <GlassCard className="p-4" hover={false}>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Quick Actions */}
            <div className="flex-1">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>Quick Actions</h2>
              <div className="flex flex-row gap-2">
                <button
                  onClick={() => navigate('/assignments')}
                  className="px-4 py-2 bg-[#FA812F] hover:bg-[#E6721A] text-white flex items-center gap-2 transition-all text-sm whitespace-nowrap"
                >
                  <Shuffle size={16} />
                  Manage Rotations
                </button>
                <button
                  onClick={() => navigate('/dealers')}
                  className="px-4 py-2 bg-[#FA812F] hover:bg-[#E6721A] text-white flex items-center gap-2 transition-all text-sm whitespace-nowrap"
                >
                  <Users size={16} />
                  Dealer Management
                </button>
                <button
                  onClick={() => navigate('/tables')}
                  className="px-4 py-2 bg-[#FA812F] hover:bg-[#E6721A] text-white flex items-center gap-2 transition-all text-sm whitespace-nowrap"
                >
                  <Table2 size={16} />
                  Table Configuration
                </button>
                <button
                  onClick={() => navigate('/breaks')}
                  className="px-4 py-2 bg-[#FA812F] hover:bg-[#E6721A] text-white flex items-center gap-2 transition-all text-sm whitespace-nowrap"
                >
                  <Coffee size={16} />
                  Break Management
                </button>
              </div>
          </div>

            {/* Divider */}
            <div className={`hidden lg:block w-px flex-shrink-0 ${isDark ? 'bg-slate-700' : 'bg-gray-300'}`}></div>

            {/* Recent Activity */}
            <div className="flex-1 min-w-0">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>Recent Activity</h2>
              <div className="overflow-hidden relative w-full">
                {(() => {
                  const last10Activities = recentActivity.slice(-10);
                  const displayActivities = last10Activities.length > 2 ? [...last10Activities, ...last10Activities] : last10Activities;
                  const cardWidth = 280; // w-[280px]
                  const gap = 12; // gap-3 = 12px
                  const cardWithGap = cardWidth + gap;
                  return (
                    <div 
                      className="flex gap-3" 
                      style={{ 
                        width: `${displayActivities.length * cardWithGap}px`,
                        willChange: 'transform',
                        animation: last10Activities.length > 2 ? `slide-horizontal-round ${last10Activities.length * 4}s linear infinite` : 'none',
                        '--slide-count': last10Activities.length
                      } as React.CSSProperties & { '--slide-count': number }}
                    >
                      {displayActivities.length > 0 ? displayActivities.map((activity, index) => {
                  const Icon = activity.icon;
                  const colors = {
                    success: isDark ? 'text-white bg-green-500/10' : 'text-gray-700 bg-green-100',
                    info: isDark ? 'text-white bg-blue-500/10' : 'text-gray-700 bg-blue-100',
                    warning: isDark ? 'text-white bg-amber-500/10' : 'text-gray-700 bg-amber-100'
                  };
                  
                  return (
                      <div 
                        key={index} 
                        className="flex-shrink-0 w-[280px] p-3 rounded-lg border"
                        style={{ 
                          borderColor: isDark ? '#334155' : '#e2e8f0',
                          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.5)'
                        }}
                      >
                        <div className="flex items-start space-x-2.5">
                      {activity.dealer ? (
                        <img 
                          src={activity.dealer.profileImage || '/images/dealer.png'} 
                          alt={activity.dealer.employee?.fullName}
                              className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                            <div className={`p-1.5 flex-shrink-0 ${colors[activity.type as keyof typeof colors]}`}>
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
                    </div>
                  );
                }) : (
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'} py-4`}>No recent activity</p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Enhanced Dealer Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Current Dealers - Enhanced */}
          <GlassCard className="p-3" hover={false}>
            <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Current Dealers</h3>
            <div className="space-y-2">
              {currentDealers.length > 0 ? currentDealers.map((dealer) => {
                const progress = Math.min((dealer.rotationTime / 20) * 100, 100);
                const isWarning = dealer.rotationTime >= 18;
                const isDanger = dealer.rotationTime >= 20;
                return (
                  <div key={dealer.id} className={`p-2 rounded-lg ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'} border ${isDanger ? 'border-red-500/50' : isWarning ? 'border-yellow-500/50' : isDark ? 'border-slate-800' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                    <img 
                      src={dealer.profileImage || '/images/dealer.png'} 
                      alt={dealer.employee?.fullName}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{dealer.employee?.fullName}</p>
                        <p className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{dealer.table?.tableNumber || 'No table'}</p>
                      </div>
                      <div className={`text-[10px] px-1.5 py-0.5 rounded ${isDanger ? 'bg-red-500/20 text-red-400' : isWarning ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {dealer.rotationTime}m
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <Award className={`w-2.5 h-2.5 ${isDark ? 'text-yellow-500' : 'text-yellow-600'}`} />
                          <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>Skill:</span>
                          <span className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{dealer.stats?.skillRating}%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className={`w-2.5 h-2.5 ${isDark ? 'text-blue-500' : 'text-blue-600'}`} />
                          <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>{dealer.stats?.timeWorked}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Gamepad2 className={`w-2.5 h-2.5 ${isDark ? 'text-purple-500' : 'text-purple-600'}`} />
                          <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>{dealer.stats?.gamesCount}</span>
                        </div>
                      </div>
                      <div className={`h-1 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`}>
                        <div 
                          className={`h-full transition-all ${isDanger ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-blue-500'}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <p className={`text-xs text-center py-3 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>No active dealers</p>
              )}
            </div>
          </GlassCard>

          {/* Next Dealers - Enhanced */}
          <GlassCard className="p-3" hover={false}>
            <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Next Dealers</h3>
            <div className="space-y-2">
              {availableDealers.length > 0 ? availableDealers.map((dealer) => (
                <div key={dealer.id} className={`p-2 rounded-lg ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'} border ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <img 
                      src={dealer.profileImage || '/images/dealer.png'} 
                      alt={dealer.employee?.fullName}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{dealer.employee?.fullName}</p>
                      <p className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Level {dealer.seniorityLevel}</p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">Ready</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <Award className={`w-2.5 h-2.5 ${isDark ? 'text-yellow-500' : 'text-yellow-600'}`} />
                      <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>Skill:</span>
                      <span className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{dealer.stats?.skillRating}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className={`w-2.5 h-2.5 ${isDark ? 'text-blue-500' : 'text-blue-600'}`} />
                      <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>{dealer.stats?.timeWorked}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Gamepad2 className={`w-2.5 h-2.5 ${isDark ? 'text-purple-500' : 'text-purple-600'}`} />
                      <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>{dealer.stats?.gamesCount}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <p className={`text-xs text-center py-3 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>No available dealers</p>
              )}
            </div>
          </GlassCard>

          {/* Dealers on Break - Enhanced */}
          <GlassCard className="p-3" hover={false}>
            <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Dealers on Break</h3>
            <div className="space-y-2">
              {dealersOnBreak.length > 0 ? dealersOnBreak.map((dealer) => {
                const breakProgress = dealer.remaining > 0 ? ((dealer.breakRecord.expectedDurationMinutes - dealer.remaining) / dealer.breakRecord.expectedDurationMinutes) * 100 : 100;
                const isOverdue = dealer.remaining <= 0;
                return (
                  <div key={dealer.id} className={`p-2 rounded-lg ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'} border ${isOverdue ? 'border-red-500/50' : isDark ? 'border-slate-800' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <img 
                        src={dealer.profileImage || '/images/dealer.png'} 
                        alt={dealer.employee?.fullName}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{dealer.employee?.fullName}</p>
                        <p className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                          {isOverdue ? 'Overdue' : `${dealer.remaining} min remaining`}
                        </p>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${isOverdue ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {dealer.breakRecord.breakType}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <Award className={`w-2.5 h-2.5 ${isDark ? 'text-yellow-500' : 'text-yellow-600'}`} />
                          <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>Skill:</span>
                          <span className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{dealer.stats?.skillRating}%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className={`w-2.5 h-2.5 ${isDark ? 'text-blue-500' : 'text-blue-600'}`} />
                          <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>{dealer.stats?.timeWorked}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Gamepad2 className={`w-2.5 h-2.5 ${isDark ? 'text-purple-500' : 'text-purple-600'}`} />
                          <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>{dealer.stats?.gamesCount}</span>
                        </div>
                      </div>
                      <div className={`h-1 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`}>
                        <div 
                          className={`h-full transition-all ${isOverdue ? 'bg-red-500' : 'bg-amber-500'}`}
                          style={{ width: `${breakProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <p className={`text-xs text-center py-3 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>No dealers on break</p>
                )}
              </div>
            </GlassCard>
        </div>

        {/* Active Tables Section - Matching Assignments Style */}
        {(activeTablesWithDealers.length > 0 || allTablesCount > 0) && (
            <GlassCard className="p-4" hover={false}>
            <h3 className={`text-base font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Active Tables</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {activeTablesWithDealers.map((table) => {
                const rotationTime = table.assignment ? Math.floor((new Date().getTime() - new Date(table.assignment.startTime).getTime()) / 60000) : 0;
                const progress = Math.min((rotationTime / 20) * 100, 100);
                const isWarning = rotationTime >= 18;
                const isDanger = rotationTime >= 20;
                const stats = table.currentDealer ? getDealerStats(table.currentDealer.id, assignmentsData) : null;
                const getTimeColor = () => {
                  if (isDanger) return isDark ? 'text-red-400' : 'text-red-600';
                  if (isWarning) return isDark ? 'text-yellow-400' : 'text-yellow-600';
                  return isDark ? 'text-green-400' : 'text-green-600';
                };
                const getProgressColor = () => {
                  if (isDanger) return 'bg-red-500';
                  if (isWarning) return 'bg-yellow-500';
                  return 'bg-green-500';
                };
                
                return (
                  <div 
                    key={table.id} 
                    className={`relative overflow-hidden p-3 transition-all duration-300 ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:shadow-md'} border ${isDanger ? 'border-red-500/50' : isWarning ? 'border-yellow-500/50' : isDark ? 'border-slate-700' : 'border-gray-200'}`}
                  >
                    {table.currentDealer && (
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/10 to-blue-500/10 -mr-12 -mt-12 blur-xl"></div>
                    )}
                    
                    <div className="relative">
                      <div className="flex justify-between items-start mb-2.5">
                        <div className="flex items-center gap-2 flex-1">
                          <img 
                            src={table.tableImage || '/images/casinotable.jpeg'} 
                            alt={table.tableNumber}
                            className="w-8 h-8 rounded object-cover"
                          />
                          <div>
                            <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{table.tableNumber}</h4>
                            <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{table.gameType} • {table.pit}</p>
                          </div>
                        </div>
                      </div>

                      {table.currentDealer ? (
                        <div className="space-y-2">
                          <div className={`flex items-center gap-2 p-2 ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'} border-l-2 ${isDanger ? 'border-red-500' : isWarning ? 'border-yellow-500' : 'border-green-500'}`}>
                            <img 
                              src={table.currentDealer.profileImage || '/images/dealer.png'} 
                              alt={table.currentDealer.employee?.fullName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-gray-900'} truncate mb-0.5`}>{table.currentDealer.employee?.fullName}</p>
                              <div className={`flex items-center gap-1.5 px-1.5 py-0.5 ${isDark ? 'bg-slate-800/50' : 'bg-gray-100'} w-fit`}>
                                <div className="flex items-center gap-0.5">
                                  <span className={`text-[8px] font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>LVL</span>
                                  <span className={`text-[9px] font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{table.currentDealer.seniorityLevel}</span>
                                </div>
                                <div className={`w-px h-2.5 ${isDark ? 'bg-slate-700' : 'bg-gray-300'}`}></div>
                                <div className="flex items-center gap-0.5">
                                  <Award size={8} className="text-yellow-500" />
                                  <span className={`text-[9px] font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{stats?.skillRating}%</span>
                                </div>
                                <div className={`w-px h-2.5 ${isDark ? 'bg-slate-700' : 'bg-gray-300'}`}></div>
                                <div className="flex items-center gap-0.5">
                                  <Clock size={8} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                                  <span className={`text-[9px] font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{stats?.timeWorked}</span>
                                </div>
                                <div className={`w-px h-2.5 ${isDark ? 'bg-slate-700' : 'bg-gray-300'}`}></div>
                                <div className="flex items-center gap-0.5">
                                  <Gamepad2 size={8} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
                                  <span className={`text-[9px] font-semibold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{stats?.gamesCount}</span>
                                </div>
                              </div>
              </div>
          </div>

                          <div className="mb-2">
                            <div className="flex justify-between text-[9px] mb-1">
                              <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>Rotation</span>
                              <div className="flex items-center gap-1.5">
                                <span className={getTimeColor()}>{rotationTime}/20 min</span>
                              </div>
                            </div>
                            <div className={`w-full h-1 ${isDark ? 'bg-slate-900' : 'bg-gray-200'}`}>
                              <div 
                                className={`h-1 transition-all duration-1000 ${getProgressColor()}`}
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className={`text-center py-4 border-2 border-dashed ${isDark ? 'border-slate-700' : 'border-gray-300'}`}>
                          <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>No dealer assigned</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
        </div>
          </GlassCard>
        )}

      </div>
    </div>
  );
}
