import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { useNavigate } from 'react-router-dom';
import { Users, Table2, Coffee, Shuffle, TrendingUp, Clock, AlertCircle, CheckCircle2, Calendar, Award, Gamepad2 } from 'lucide-react';
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

    // Active tables with dealers
    const activeTables = tables
      .filter((t: any) => t.status === 'Open')
      .map((table: any) => {
        const assignment = assignments.find((a: any) => a.tableId === table.id && a.isCurrent);
        const dealer = assignment ? dealersWithEmployees.find((d: any) => d.id === assignment.dealerId) : null;
        return { ...table, currentDealer: dealer, assignment };
      })
      .filter((t: any) => t.currentDealer)
      .slice(0, 5);

    // Pending rotations (dealers approaching or exceeding 20 minutes)
    const pending = current.filter((d: any) => d.rotationTime >= 18).length;
    setPendingRotations(pending);

    setCurrentDealers(current);
    setAvailableDealers(available);
    setDealersOnBreak(onBreak);
    setActiveTablesWithDealers(activeTables);

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
    totalDealers: dealersForDay,
    activeTables: activeTablesWithDealers.length,
    dealersOnBreak: dealersOnBreak.length,
    pendingRotations: pendingRotations
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
          {/* Redesigned Time Component */}
          <GlassCard className="px-5 py-4" hover={false}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className={`p-2.5 rounded-xl ${isDark ? 'bg-[#FA812F]/20' : 'bg-[#FA812F]/10'}`}>
                  <Clock className="w-5 h-5 text-[#FA812F]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} font-mono tracking-tight`}>
                      {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </p>
                    <p className={`text-lg font-mono ${isDark ? 'text-slate-400' : 'text-gray-500'} font-semibold`}>
                      {String(currentTime.getSeconds()).padStart(2, '0')}
                    </p>
                  </div>
                  <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}
                  </p>
                </div>
              </div>
              <div className={`h-12 w-px ${isDark ? 'bg-slate-700/50' : 'bg-gray-300'}`}></div>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {currentTime.toLocaleDateString('en-US', { year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Enhanced KPI Cards matching Assignments style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard onClick={() => navigate('/dealers')} className="p-3" hover={true}>
            <div className="mb-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                  <Users className={isDark ? 'text-slate-400' : 'text-gray-500'} size={18} />
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Total Dealers</p>
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>{stats.totalDealers}</span>
              </p>
            </div>
          </GlassCard>

          <GlassCard onClick={() => navigate('/tables')} className="p-3" hover={true}>
            <div className="mb-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                  <Table2 className={isDark ? 'text-slate-400' : 'text-gray-500'} size={18} />
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Active Tables</p>
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>{stats.activeTables}</span>
              </p>
            </div>
          </GlassCard>

          <GlassCard onClick={() => navigate('/breaks')} className="p-3" hover={true}>
            <div className="mb-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                  <Coffee className={isDark ? 'text-slate-400' : 'text-gray-500'} size={18} />
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>On Break</p>
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <span className={isDark ? 'text-amber-400' : 'text-amber-600'}>{stats.dealersOnBreak}</span>
              </p>
            </div>
          </GlassCard>

          <GlassCard onClick={() => navigate('/assignments')} className="p-3" hover={true}>
            <div className="mb-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                  <Shuffle className={isDark ? 'text-slate-400' : 'text-gray-500'} size={18} />
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Rotations Due</p>
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <span className={isDark ? 'text-purple-400' : 'text-purple-600'}>{stats.pendingRotations}</span>
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Enhanced Dealer Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Current Dealers - Enhanced */}
          <GlassCard className="p-4" hover={false}>
            <h3 className={`text-base font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Current Dealers</h3>
            <div className="space-y-2.5">
              {currentDealers.length > 0 ? currentDealers.map((dealer) => {
                const progress = Math.min((dealer.rotationTime / 20) * 100, 100);
                const isWarning = dealer.rotationTime >= 18;
                const isDanger = dealer.rotationTime >= 20;
                return (
                  <div key={dealer.id} className={`p-2.5 rounded-lg ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'} border ${isDanger ? 'border-red-500/50' : isWarning ? 'border-yellow-500/50' : isDark ? 'border-slate-800' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2.5 mb-2">
                      <img 
                        src={dealer.profileImage || '/images/dealer.png'} 
                        alt={dealer.employee?.fullName}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{dealer.employee?.fullName}</p>
                        <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{dealer.table?.tableNumber || 'No table'}</p>
                      </div>
                      <div className={`text-xs px-2 py-0.5 rounded ${isDanger ? 'bg-red-500/20 text-red-400' : isWarning ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {dealer.rotationTime}m
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Award className={`w-3 h-3 ${isDark ? 'text-yellow-500' : 'text-yellow-600'}`} />
                          <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>Skill:</span>
                          <span className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{dealer.stats?.skillRating}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className={`w-3 h-3 ${isDark ? 'text-blue-500' : 'text-blue-600'}`} />
                          <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>{dealer.stats?.timeWorked}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Gamepad2 className={`w-3 h-3 ${isDark ? 'text-purple-500' : 'text-purple-600'}`} />
                          <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>{dealer.stats?.gamesCount}</span>
                        </div>
                      </div>
                      <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`}>
                        <div 
                          className={`h-full transition-all ${isDanger ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-blue-500'}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <p className={`text-sm text-center py-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>No active dealers</p>
              )}
            </div>
          </GlassCard>

          {/* Next Dealers - Enhanced */}
          <GlassCard className="p-4" hover={false}>
            <h3 className={`text-base font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Next Dealers</h3>
            <div className="space-y-2.5">
              {availableDealers.length > 0 ? availableDealers.map((dealer) => (
                <div key={dealer.id} className={`p-2.5 rounded-lg ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'} border ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2.5 mb-2">
                    <img 
                      src={dealer.profileImage || '/images/dealer.png'} 
                      alt={dealer.employee?.fullName}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{dealer.employee?.fullName}</p>
                      <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Level {dealer.seniorityLevel}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">Ready</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Award className={`w-3 h-3 ${isDark ? 'text-yellow-500' : 'text-yellow-600'}`} />
                      <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>Skill:</span>
                      <span className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{dealer.stats?.skillRating}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className={`w-3 h-3 ${isDark ? 'text-blue-500' : 'text-blue-600'}`} />
                      <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>{dealer.stats?.timeWorked}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gamepad2 className={`w-3 h-3 ${isDark ? 'text-purple-500' : 'text-purple-600'}`} />
                      <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>{dealer.stats?.gamesCount}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <p className={`text-sm text-center py-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>No available dealers</p>
              )}
            </div>
          </GlassCard>

          {/* Dealers on Break - Enhanced */}
          <GlassCard className="p-4" hover={false}>
            <h3 className={`text-base font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Dealers on Break</h3>
            <div className="space-y-2.5">
              {dealersOnBreak.length > 0 ? dealersOnBreak.map((dealer) => {
                const breakProgress = dealer.remaining > 0 ? ((dealer.breakRecord.expectedDurationMinutes - dealer.remaining) / dealer.breakRecord.expectedDurationMinutes) * 100 : 100;
                const isOverdue = dealer.remaining <= 0;
                return (
                  <div key={dealer.id} className={`p-2.5 rounded-lg ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'} border ${isOverdue ? 'border-red-500/50' : isDark ? 'border-slate-800' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2.5 mb-2">
                      <img 
                        src={dealer.profileImage || '/images/dealer.png'} 
                        alt={dealer.employee?.fullName}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{dealer.employee?.fullName}</p>
                        <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                          {isOverdue ? 'Overdue' : `${dealer.remaining} min remaining`}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${isOverdue ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {dealer.breakRecord.breakType}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Award className={`w-3 h-3 ${isDark ? 'text-yellow-500' : 'text-yellow-600'}`} />
                          <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>Skill:</span>
                          <span className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{dealer.stats?.skillRating}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className={`w-3 h-3 ${isDark ? 'text-blue-500' : 'text-blue-600'}`} />
                          <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>{dealer.stats?.timeWorked}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Gamepad2 className={`w-3 h-3 ${isDark ? 'text-purple-500' : 'text-purple-600'}`} />
                          <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>{dealer.stats?.gamesCount}</span>
                        </div>
                      </div>
                      <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`}>
                        <div 
                          className={`h-full transition-all ${isOverdue ? 'bg-red-500' : 'bg-amber-500'}`}
                          style={{ width: `${breakProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <p className={`text-sm text-center py-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>No dealers on break</p>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Active Tables Section */}
        {activeTablesWithDealers.length > 0 && (
          <GlassCard className="p-4" hover={false}>
            <h3 className={`text-base font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Active Tables</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {activeTablesWithDealers.map((table) => (
                <div key={table.id} className={`p-2.5 rounded-lg ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'} border ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <img 
                      src={table.currentDealer?.profileImage || '/images/dealer.png'} 
                      alt={table.currentDealer?.employee?.fullName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{table.tableNumber}</p>
                      <p className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{table.currentDealer?.employee?.fullName}</p>
                    </div>
                  </div>
                  <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{table.gameType}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

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
