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

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'} p-6`}>
      <div className="max-w-7xl mx-auto space-y-6">
        <Breadcrumb />
        {/* Header */}
        <div>
          <h2 className={`text-3xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <div className={`p-2  ${isDark ? 'bg-blue-500/10' : 'bg-blue-100'}`}>
              <Activity className={isDark ? 'text-blue-400' : 'text-blue-600'} size={28} />
            </div>
            Analytics Dashboard
          </h2>
          <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Real-time insights and performance metrics</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center justify-between mb-2">
              <Users className="text-blue-400" size={24} />
              <TrendingUp className="text-green-400" size={16} />
            </div>
            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.totalDealers}</p>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Total Dealers</p>
          </GlassCard>

          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center justify-between mb-2">
              <Table2 className="text-emerald-400" size={24} />
              <TrendingUp className="text-green-400" size={16} />
            </div>
            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.activeTables}</p>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Active Tables</p>
          </GlassCard>

          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center justify-between mb-2">
              <Activity className="text-purple-400" size={24} />
              <TrendingUp className="text-green-400" size={16} />
            </div>
            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.totalAssignments}</p>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Total Rotations</p>
          </GlassCard>

          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center justify-between mb-2">
              <Clock className="text-amber-400" size={24} />
            </div>
            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.avgRotationTime}m</p>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Avg Rotation</p>
          </GlassCard>

          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-blue-400" size={24} />
            </div>
            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.dealerUtilization}%</p>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Utilization</p>
          </GlassCard>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rotation Trends */}
          <GlassCard className="p-6" hover={false}>
            <h3 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Rotation Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={rotationTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Legend />
                <Line type="monotone" dataKey="rotations" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Dealer Status Distribution */}
          <GlassCard className="p-6" hover={false}>
            <h3 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Dealer Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dealerStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dealerStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table Activity by Game Type */}
          <GlassCard className="p-6" hover={false}>
            <h3 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Active Tables by Game Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tableActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Performance Metrics */}
          <GlassCard className="p-6" hover={false}>
            <h3 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Performance Metrics</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>Dealer Efficiency</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>92%</span>
                </div>
                <div className="w-full bg-slate-700/30  h-3">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 " style={{ width: '92%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>Table Coverage</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>87%</span>
                </div>
                <div className="w-full bg-slate-700/30  h-3">
                  <div className="bg-gradient-to-r from-emerald-500 to-green-500 h-3 " style={{ width: '87%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>Break Compliance</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>98%</span>
                </div>
                <div className="w-full bg-slate-700/30  h-3">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 " style={{ width: '98%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>Rotation Timing</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>95%</span>
                </div>
                <div className="w-full bg-slate-700/30  h-3">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 " style={{ width: '95%' }}></div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
