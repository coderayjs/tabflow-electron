import { useState, useEffect } from 'react';
import { Table } from '../models';
import { GameType, TableStatus } from '../enums';
import { Table2, Plus, Trash2, Users, Clock, Spade, Circle, Dices, Diamond, Edit } from 'lucide-react';
import { TableService } from '../services';
import AddTableModal from './AddTableModal';
import Breadcrumb from './Breadcrumb';
import { useThemeStore } from '../stores/themeStore';
import GlassCard from './GlassCard';

export default function TableManagement() {
  const { isDark } = useThemeStore();
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const tableService = new TableService();

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      const tablesData = await tableService.getAllTables();
      setTables(tablesData);
    } catch (error) {
      console.error('Error loading tables:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGameTypeColor = (gameType: GameType) => {
    switch (gameType) {
      case GameType.Blackjack: return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case GameType.Roulette: return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
      case GameType.Craps: return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      case GameType.Baccarat: return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
    }
  };

  const getGameIcon = (gameType: GameType) => {
    switch (gameType) {
      case GameType.Blackjack: return <Spade size={16} />;
      case GameType.Roulette: return <Circle size={16} />;
      case GameType.Craps: return <Dices size={16} />;
      case GameType.Baccarat: return <Diamond size={16} />;
      default: return <Table2 size={16} />;
    }
  };

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case TableStatus.Open: return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      case TableStatus.Closed: return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
      case TableStatus.NeedsDealer: return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      case TableStatus.Locked: return 'bg-orange-500/20 text-orange-300 border border-orange-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
    }
  };

  const handleStatusChange = async (tableId: number, newStatus: TableStatus) => {
    try {
      await tableService.updateStatus(tableId, newStatus);
      await loadTables();
    } catch (error) {
      console.error('Error updating table status:', error);
    }
  };

  const handleDeleteTable = async (tableId: number) => {
    if (!confirm('Are you sure you want to delete this table?')) return;

    try {
      await tableService.deleteTable(tableId);
      await loadTables();
    } catch (error) {
      console.error('Error deleting table:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading tables...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'} p-6`}>
      <div className="max-w-7xl mx-auto space-y-6">
        <Breadcrumb />
        <div className="flex justify-between items-center">
          <div>
            <h2 className={`text-3xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <div className={`p-2  ${isDark ? 'bg-blue-500/10' : 'bg-blue-100'}`}>
                <Table2 className={isDark ? 'text-blue-400' : 'text-blue-600'} size={28} />
              </div>
              Table Management
            </h2>
            <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Manage casino tables and game configurations</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-[#FA812F] hover:bg-[#E6721A] text-white  flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
          >
            <Plus size={20} />
            Add Table
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tables.map((table) => (
            <GlassCard key={table.id} className="p-4 relative overflow-hidden group" hover={false}>
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${table.status === TableStatus.Open ? 'from-green-500/10 to-blue-500/10' : 'from-gray-500/10 to-slate-500/10'} -mr-12 -mt-12 blur-xl`}></div>
              
              <div className="relative">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{table.tableNumber}</h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{table.pit}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => {
                        setSelectedTable(table);
                        setShowEditModal(true);
                      }}
                      className="p-1.5 hover:bg-blue-500/20 transition-all"
                      title="Edit"
                    >
                      <Edit size={14} className="text-blue-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteTable(table.id)}
                      className="p-1.5 hover:bg-red-500/20 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>

                <div className={`mb-3 px-2 py-1.5 ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'} flex items-center justify-center gap-2`}>
                  <span className={getGameTypeColor(table.gameType)}>
                    {getGameIcon(table.gameType)}
                  </span>
                  <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {table.gameType}
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Limits</span>
                    <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>${table.minBet}-${table.maxBet}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                      <Users size={12} />
                      Dealers
                    </span>
                    <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{table.requiredDealerCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                      <Clock size={12} />
                      Rotation
                    </span>
                    <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{table.pushIntervalMinutes}m</span>
                  </div>
                </div>

                <select
                  value={table.status}
                  onChange={(e) => handleStatusChange(table.id, e.target.value as TableStatus)}
                  className={`w-full px-2 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all ${isDark ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-900'} ${getStatusColor(table.status)}`}
                >
                  {Object.values(TableStatus).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </GlassCard>
          ))}
        </div>

        {tables.length === 0 && (
          <GlassCard className="text-center py-16" hover={false}>
            <div className={`p-4  w-20 h-20 mx-auto mb-4 flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
              <Table2 className={`w-10 h-10 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>No tables configured</h3>
            <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Get started by adding your first table</p>
          </GlassCard>
        )}

        {showAddModal && (
          <AddTableModal
            onClose={() => setShowAddModal(false)}
            onSuccess={loadTables}
          />
        )}

        {showEditModal && selectedTable && (
          <AddTableModal
            onClose={() => {
              setShowEditModal(false);
              setSelectedTable(null);
            }}
            onSuccess={loadTables}
            table={selectedTable}
          />
        )}
      </div>
    </div>
  );
}
