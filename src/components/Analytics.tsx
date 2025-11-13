import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Table2, Clock, Activity } from 'lucide-react';
import { getDatabase } from '../utils/database';
import Breadcrumb from './Breadcrumb';
import { useThemeStore } from '../stores/themeStore';
import GlassCard from './GlassCard';

export default function Analytics() {
  const { isDark } = useThemeStore();
  const [stats, setStats] = useState({
    totalDealers: 0,
    activeTables: 0,
    totalAssignments: 0,
    avgRotationTime: 0,
    dealerUtilization: 0
  });

  const [dealerStatusData, setDealerStatusData] = useState<any[]>([]);
  const [tableActivityData, setTableActivityData] = useState<any[]>([]);
  const [rotationTrends, setRotationTrends] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    const db = await getDatabase();
    const dealers = db.tables.get('Dealers') || [];
    const tables = db.tables.get('Tables') || [];
    const assignments = db.tables.get('Assignments') || [];
    const breaks = db.tables.get('BreakRecords') || [];

    // Calculate stats
    const activeTables = tables.filter((t: any) => t.status === 'Open').length;
    const activeAssignments = assignments.filter((a: any) => a.isCurrent).length;
    
    setStats({
      totalDealers: dealers.length,
      activeTables,
      totalAssignments: assignments.length,
      avgRotationTime: 22,
      dealerUtilization: Math.round((activeAssignments / dealers.length) * 100)
    });

    // Dealer status distribution
    const statusCounts: any = {};
    dealers.forEach((d: any) => {
      statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
    });
    
    setDealerStatusData(
      Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
    );

    // Table activity by game type
    const gameTypeCounts: any = {};
    tables.forEach((t: any) => {
      if (t.status === 'Open') {
        gameTypeCounts[t.gameType] = (gameTypeCounts[t.gameType] || 0) + 1;
      }
    });
    
    setTableActivityData(
      Object.entries(gameTypeCounts).map(([name, value]) => ({ name, value }))
    );

    // Rotation trends (mock data for demo)
    setRotationTrends([
      { time: '8:00', rotations: 12 },
      { time: '10:00', rotations: 18 },
      { time: '12:00', rotations: 24 },
      { time: '14:00', rotations: 21 },
      { time: '16:00', rotations: 15 },
      { time: '18:00', rotations: 28 },
      { time: '20:00', rotations: 32 },
      { time: '22:00', rotations: 25 }
    ]);
  };

  // Professional color palette - limited to 2-3 colors
  const PRIMARY_COLOR = '#3b82f6'; // Blue
  const SECONDARY_COLOR = '#8b5cf6'; // Purple
  const ACCENT_COLOR = '#10b981'; // Green for positive metrics
  
  // Simplified colors for charts
  const CHART_COLORS = [PRIMARY_COLOR, SECONDARY_COLOR, ACCENT_COLOR];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'} p-6`}>
      <div className="max-w-7xl mx-auto space-y-3">
        <Breadcrumb />
        {/* Header */}
        <div>
          <h2 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
              <Activity className={isDark ? 'text-slate-400' : 'text-gray-500'} size={20} />
            </div>
            Analytics Dashboard
          </h2>
          <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Real-time insights and performance metrics</p>
        </div>

        {/* KPI Cards - Matching Dashboard style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <GlassCard className="p-2.5" hover={false}>
            <div className="mb-1.5">
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`p-1 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                  <Users className={isDark ? 'text-slate-400' : 'text-gray-500'} size={16} />
                </div>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Total Dealers</p>
              </div>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>{stats.totalDealers}</span>
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-2.5" hover={false}>
            <div className="mb-1.5">
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`p-1 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                  <Table2 className={isDark ? 'text-slate-400' : 'text-gray-500'} size={16} />
                </div>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Active Tables</p>
              </div>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>{stats.activeTables}</span>
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-2.5" hover={false}>
            <div className="mb-1.5">
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`p-1 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                  <Activity className={isDark ? 'text-slate-400' : 'text-gray-500'} size={16} />
                </div>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Total Rotations</p>
              </div>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>{stats.totalAssignments}</span>
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-2.5" hover={false}>
            <div className="mb-1.5">
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`p-1 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                  <Clock className={isDark ? 'text-slate-400' : 'text-gray-500'} size={16} />
                </div>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Avg Rotation</p>
              </div>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>{stats.avgRotationTime}m</span>
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-2.5" hover={false}>
            <div className="mb-1.5">
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`p-1 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                  <TrendingUp className={isDark ? 'text-slate-400' : 'text-gray-500'} size={16} />
                </div>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Utilization</p>
              </div>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>{stats.dealerUtilization}%</span>
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Rotation Trends */}
          <GlassCard className="p-4" hover={false}>
            <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Rotation Trends</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={rotationTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                <XAxis 
                  dataKey="time" 
                  stroke={isDark ? '#94a3b8' : '#64748b'} 
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}
                />
                <YAxis 
                  stroke={isDark ? '#94a3b8' : '#64748b'} 
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#1e293b' : '#ffffff', 
                    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, 
                    borderRadius: '8px',
                    color: isDark ? '#e2e8f0' : '#1e293b'
                  }}
                  labelStyle={{ color: isDark ? '#e2e8f0' : '#1e293b' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="rotations" 
                  stroke={PRIMARY_COLOR} 
                  strokeWidth={2.5} 
                  dot={{ fill: PRIMARY_COLOR, r: 4 }} 
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Dealer Status Distribution */}
          <GlassCard className="p-4" hover={false}>
            <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Dealer Status</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={dealerStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={65}
                  fill={PRIMARY_COLOR}
                  dataKey="value"
                >
                  {dealerStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#1e293b' : '#ffffff', 
                    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, 
                    borderRadius: '8px',
                    color: isDark ? '#e2e8f0' : '#1e293b'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Table Activity by Game Type */}
          <GlassCard className="p-4" hover={false}>
            <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Active Tables by Game Type</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tableActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                <XAxis 
                  dataKey="name" 
                  stroke={isDark ? '#94a3b8' : '#64748b'} 
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}
                />
                <YAxis 
                  stroke={isDark ? '#94a3b8' : '#64748b'} 
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#1e293b' : '#ffffff', 
                    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, 
                    borderRadius: '8px',
                    color: isDark ? '#e2e8f0' : '#1e293b'
                  }}
                  labelStyle={{ color: isDark ? '#e2e8f0' : '#1e293b' }}
                />
                <Bar dataKey="value" fill={PRIMARY_COLOR} radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Performance Metrics */}
          <GlassCard className="p-4" hover={false}>
            <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Performance Metrics</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>Dealer Efficiency</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>92%</span>
                </div>
                <div className={`w-full h-2 rounded-full ${isDark ? 'bg-slate-900' : 'bg-gray-200'}`}>
                  <div className={`h-2 rounded-full ${isDark ? 'bg-blue-500' : 'bg-blue-600'}`} style={{ width: '92%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>Table Coverage</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>87%</span>
                </div>
                <div className={`w-full h-2 rounded-full ${isDark ? 'bg-slate-900' : 'bg-gray-200'}`}>
                  <div className={`h-2 rounded-full ${isDark ? 'bg-blue-500' : 'bg-blue-600'}`} style={{ width: '87%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>Break Compliance</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>98%</span>
                </div>
                <div className={`w-full h-2 rounded-full ${isDark ? 'bg-slate-900' : 'bg-gray-200'}`}>
                  <div className={`h-2 rounded-full ${isDark ? 'bg-green-500' : 'bg-green-600'}`} style={{ width: '98%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>Rotation Timing</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>95%</span>
                </div>
                <div className={`w-full h-2 rounded-full ${isDark ? 'bg-slate-900' : 'bg-gray-200'}`}>
                  <div className={`h-2 rounded-full ${isDark ? 'bg-blue-500' : 'bg-blue-600'}`} style={{ width: '95%' }}></div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
