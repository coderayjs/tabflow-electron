import { useState, useEffect } from 'react';
import { getDatabase, saveDatabase } from '../utils/database';
import { Dealer, BreakRecord } from '../models';
import { DealerStatus } from '../enums';
import { Coffee, Clock, Play, Plus, Users } from 'lucide-react';
import Breadcrumb from './Breadcrumb';
import { useThemeStore } from '../stores/themeStore';
import GlassCard from './GlassCard';

interface DealerWithEmployee extends Dealer {
  employee: any;
}

interface BreakWithDealer extends BreakRecord {
  dealer?: DealerWithEmployee;
}

export default function BreakManagement() {
  const { isDark } = useThemeStore();
  const [dealersOnBreak, setDealersOnBreak] = useState<BreakWithDealer[]>([]);
  const [availableDealers, setAvailableDealers] = useState<DealerWithEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddBreakModal, setShowAddBreakModal] = useState(false);
  const [selectedDealerForBreak, setSelectedDealerForBreak] = useState<DealerWithEmployee | null>(null);
  const [selectedBreakType, setSelectedBreakType] = useState<string>('Break');
  const [selectedDuration, setSelectedDuration] = useState<number>(15);

  useEffect(() => {
    loadBreakData();
  }, []);

  const loadBreakData = async () => {
    try {
      const db = await getDatabase();
      const dealersData = db.tables.get('Dealers') || [];
      const employeesData = db.tables.get('Employees') || [];
      const breaksData = db.tables.get('BreakRecords') || [];

      // Enrich dealers with employee data
      const dealersWithEmployees = dealersData.map((dealer: any) => {
        const employee = employeesData.find((emp: any) => emp.id === dealer.employeeId);
        return {
          ...dealer,
          employee: employee || { firstName: 'Unknown', lastName: '', fullName: 'Unknown' }
        } as DealerWithEmployee;
      });

      // Get dealers currently on break by status
      const dealersCurrentlyOnBreak = dealersWithEmployees.filter(d => 
        d.status === DealerStatus.OnBreak || d.status === DealerStatus.OnMeal
      );

      // Map to break records
      const activeBreaks = dealersCurrentlyOnBreak.map(dealer => {
        const breakRecord = breaksData
          .filter((b: any) => !b.endTime && b.dealerId === dealer.id)
          .sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];
        
        return breakRecord ? {
          ...breakRecord,
          dealer
        } as BreakWithDealer : null;
      }).filter(b => b !== null) as BreakWithDealer[];

      // Get available dealers (not on break and not dealing)
      const available = dealersWithEmployees.filter(d =>
        d.status !== DealerStatus.OnBreak &&
        d.status !== DealerStatus.OnMeal &&
        d.status !== DealerStatus.Dealing
      );

      setDealersOnBreak(activeBreaks);
      setAvailableDealers(available);
    } catch (error) {
      console.error('Error loading break data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToBreak = async (dealerId: number, breakType: string, durationMinutes: number) => {
    try {
      const db = await getDatabase();
      const breaksData = db.tables.get('BreakRecords') || [];
      const dealersData = db.tables.get('Dealers') || [];

      // Create break record
      const newBreak: BreakRecord = {
        id: Math.max(0, ...breaksData.map((b: any) => b.id)) + 1,
        dealerId,
        breakType,
        startTime: new Date(),
        endTime: null,
        expectedDurationMinutes: durationMinutes,
        isCompliant: true,
        createdAt: new Date()
      };

      breaksData.push(newBreak);

      // Update dealer status
      const dealerIndex = dealersData.findIndex((d: any) => d.id === dealerId);
      if (dealerIndex !== -1) {
        dealersData[dealerIndex].status = breakType === 'Meal' ? DealerStatus.OnMeal : DealerStatus.OnBreak;
      }

      db.tables.set('BreakRecords', breaksData);
      db.tables.set('Dealers', dealersData);
      saveDatabase();
      await loadBreakData();
    } catch (error) {
      console.error('Error sending dealer to break:', error);
    }
  };

  const handleReturnFromBreak = async (breakId: number) => {
    try {
      const db = await getDatabase();
      const breaksData = db.tables.get('BreakRecords') || [];
      const dealersData = db.tables.get('Dealers') || [];

      // Find and update break record
      const breakIndex = breaksData.findIndex((b: any) => b.id === breakId);
      if (breakIndex !== -1) {
        breaksData[breakIndex].endTime = new Date();

        // Update dealer status back to available
        const dealerId = breaksData[breakIndex].dealerId;
        const dealerIndex = dealersData.findIndex((d: any) => d.id === dealerId);
        if (dealerIndex !== -1) {
          dealersData[dealerIndex].status = DealerStatus.Available;
        }
      }

      db.tables.set('BreakRecords', breaksData);
      db.tables.set('Dealers', dealersData);
      saveDatabase();
      await loadBreakData();
    } catch (error) {
      console.error('Error returning dealer from break:', error);
    }
  };

  const calculateBreakTime = (startTime: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(startTime).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins;
  };
  
  const formatBreakTime = (minutes: number) => {
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading break management...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'} p-6`}>
      <div className="max-w-7xl mx-auto space-y-6">
        <Breadcrumb />
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Coffee className={isDark ? 'text-purple-400' : 'text-purple-600'} />
            Break Management
          </h2>
          <p className={`mt-1 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>Track dealer breaks and ensure compliance</p>
        </div>
        <button
          onClick={() => setShowAddBreakModal(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white  flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          Send to Break
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <GlassCard className="p-2.5" hover={false}>
          <div className="mb-1.5">
            <div className="flex items-center gap-1.5 mb-1">
              <div className={`p-1 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                <Coffee className={isDark ? 'text-slate-400' : 'text-gray-500'} size={16} />
              </div>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>On Break</p>
            </div>
            <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
              <span className={isDark ? 'text-amber-400' : 'text-amber-600'}>
                {dealersOnBreak.filter(b => b.breakType === 'Break').length}
              </span>
            </p>
            <div className="flex items-center -space-x-2">
              {dealersOnBreak.filter(b => b.breakType === 'Break').slice(0, 3).map((breakRecord) => (
                <img
                  key={breakRecord.id}
                  src={breakRecord.dealer?.profileImage || '/images/dealer.png'}
                  alt={breakRecord.dealer?.employee.fullName}
                  className={`w-6 h-6 rounded-full border-2 object-cover ${isDark ? 'border-slate-900' : 'border-white'}`}
                  title={breakRecord.dealer?.employee.fullName}
                />
              ))}
              {dealersOnBreak.filter(b => b.breakType === 'Break').length > 3 && (
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-semibold ${isDark ? 'bg-slate-700 text-slate-300 border-slate-900' : 'bg-gray-200 text-gray-700 border-white'}`}>
                  +{dealersOnBreak.filter(b => b.breakType === 'Break').length - 3}
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-2.5" hover={false}>
          <div className="mb-1.5">
            <div className="flex items-center gap-1.5 mb-1">
              <div className={`p-1 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                <Clock className={isDark ? 'text-slate-400' : 'text-gray-500'} size={16} />
              </div>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>On Meal</p>
        </div>
            <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
              <span className={isDark ? 'text-orange-400' : 'text-orange-600'}>
                {dealersOnBreak.filter(b => b.breakType === 'Meal').length}
              </span>
            </p>
            <div className="flex items-center -space-x-2">
              {dealersOnBreak.filter(b => b.breakType === 'Meal').slice(0, 3).map((breakRecord) => (
                <img
                  key={breakRecord.id}
                  src={breakRecord.dealer?.profileImage || '/images/dealer.png'}
                  alt={breakRecord.dealer?.employee.fullName}
                  className={`w-6 h-6 rounded-full border-2 object-cover ${isDark ? 'border-slate-900' : 'border-white'}`}
                  title={breakRecord.dealer?.employee.fullName}
                />
              ))}
              {dealersOnBreak.filter(b => b.breakType === 'Meal').length > 3 && (
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-semibold ${isDark ? 'bg-slate-700 text-slate-300 border-slate-900' : 'bg-gray-200 text-gray-700 border-white'}`}>
                  +{dealersOnBreak.filter(b => b.breakType === 'Meal').length - 3}
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-2.5" hover={false}>
          <div className="mb-1.5">
            <div className="flex items-center gap-1.5 mb-1">
              <div className={`p-1 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                <Users className={isDark ? 'text-slate-400' : 'text-gray-500'} size={16} />
              </div>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Available</p>
            </div>
            <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
              <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>{availableDealers.length}</span>
            </p>
            <div className="flex items-center -space-x-2">
              {availableDealers.slice(0, 3).map((dealer) => (
                <img
                  key={dealer.id}
                  src={dealer.profileImage || '/images/dealer.png'}
                  alt={dealer.employee.fullName}
                  className={`w-6 h-6 rounded-full border-2 object-cover ${isDark ? 'border-slate-900' : 'border-white'}`}
                  title={dealer.employee.fullName}
                />
              ))}
              {availableDealers.length > 3 && (
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-semibold ${isDark ? 'bg-slate-700 text-slate-300 border-slate-900' : 'bg-gray-200 text-gray-700 border-white'}`}>
                  +{availableDealers.length - 3}
        </div>
              )}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Current Breaks */}
      <GlassCard className="p-4" hover={false}>
        <h3 className={`text-base font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Current Breaks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {dealersOnBreak.map((breakRecord) => {
            const elapsedMins = calculateBreakTime(breakRecord.startTime);
            const progress = Math.min(100, (elapsedMins / breakRecord.expectedDurationMinutes) * 100);
            const isOverdue = elapsedMins > breakRecord.expectedDurationMinutes;
            const remaining = Math.max(0, breakRecord.expectedDurationMinutes - elapsedMins);
            
            return (
              <div 
                key={breakRecord.id} 
                className={`p-3 rounded-lg transition-all duration-300 ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:shadow-md'} border ${isOverdue ? 'border-red-500/50' : isDark ? 'border-slate-700' : 'border-gray-200'}`}
              >
                <div className="flex items-center gap-2.5 mb-2.5">
                  <img 
                    src={breakRecord.dealer?.profileImage || '/images/dealer.png'} 
                    alt={breakRecord.dealer?.employee.fullName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {breakRecord.dealer?.employee.fullName || 'Unknown Dealer'}
                    </h4>
                    <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{breakRecord.breakType}</p>
                </div>
                <button
                  onClick={() => handleReturnFromBreak(breakRecord.id)}
                    className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors flex items-center gap-1"
                >
                    <Play size={12} />
                  Return
                </button>
              </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>Time:</span>
                    <span className={isDark ? 'text-white' : 'text-gray-900'}>{elapsedMins}m / {breakRecord.expectedDurationMinutes}m</span>
                </div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                      {isOverdue ? 'Overdue' : `${remaining} min left`}
                    </span>
                    <span className={isOverdue ? 'text-red-400' : isDark ? 'text-green-400' : 'text-green-600'}>
                      {progress.toFixed(0)}%
                    </span>
                </div>
                  <div className={`w-full h-1.5 ${isDark ? 'bg-slate-900' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                  <div
                      className={`h-1.5 transition-all duration-300 ${isOverdue ? 'bg-red-500' : 'bg-purple-500'}`}
                      style={{ width: `${Math.min(100, progress)}%` }}
                  />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {dealersOnBreak.length === 0 && (
          <div className={`text-center py-8 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
            <Coffee className={`mx-auto h-12 w-12 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
            <h3 className={`mt-2 text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>No dealers on break</h3>
            <p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>All dealers are working or available</p>
          </div>
        )}
      </GlassCard>

      {/* Available Dealers */}
      <GlassCard className="p-4" hover={false}>
        <h3 className={`text-base font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Available Dealers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableDealers.map((dealer) => (
            <div 
              key={dealer.id} 
              className={`p-3 rounded-lg transition-all duration-300 ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:shadow-md'} border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                  <img 
                    src={dealer.profileImage || '/images/dealer.png'} 
                    alt={dealer.employee.fullName}
                  className="w-8 h-8 rounded-full object-cover"
                  />
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {dealer.employee.fullName}
                  </h4>
                  <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                    {dealer.employee.employeeNumber} • Lvl {dealer.seniorityLevel}
                  </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSendToBreak(dealer.id, 'Break', 15)}
                  className="flex-1 px-2 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs rounded transition-colors font-medium"
                  >
                    Break
                  </button>
                  <button
                    onClick={() => handleSendToBreak(dealer.id, 'Meal', 30)}
                  className="flex-1 px-2 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded transition-colors font-medium"
                  >
                    Meal
                  </button>
              </div>
            </div>
          ))}
        </div>

        {availableDealers.length === 0 && (
          <div className={`text-center py-8 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
            <Users className={`mx-auto h-12 w-12 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
            <h3 className={`mt-2 text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>No available dealers</h3>
            <p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>All dealers are currently assigned or on break</p>
          </div>
        )}
      </GlassCard>

      {/* Add Break Modal */}
      {showAddBreakModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <GlassCard className="p-6 max-w-md w-full" hover={false}>
            <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Send Dealer to Break</h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  Select Dealer
                </label>
                <select
                  value={selectedDealerForBreak?.id || ''}
                  onChange={(e) => {
                    const dealer = availableDealers.find(d => d.id === parseInt(e.target.value));
                    setSelectedDealerForBreak(dealer || null);
                  }}
                  className={`w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${isDark ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-gray-900 border-gray-300'} border`}
                >
                  <option value="">Select a dealer</option>
                  {availableDealers.map(dealer => (
                    <option key={dealer.id} value={dealer.id}>
                      {dealer.employee.fullName} - Level {dealer.seniorityLevel}
                    </option>
                  ))}
                </select>
                {availableDealers.length === 0 && (
                  <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                    No available dealers. All dealers are currently assigned or on break.
                  </p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  Break Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBreakType('Break');
                      setSelectedDuration(15);
                    }}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      selectedBreakType === 'Break'
                        ? 'bg-amber-600 border-amber-600 text-white'
                        : isDark
                        ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-amber-500'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-amber-500'
                    }`}
                  >
                    <Coffee size={20} className="mx-auto mb-1" />
                    <div className="text-sm font-medium">Break</div>
                    <div className="text-xs opacity-80">15 min</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBreakType('Meal');
                      setSelectedDuration(30);
                    }}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      selectedBreakType === 'Meal'
                        ? 'bg-orange-600 border-orange-600 text-white'
                        : isDark
                        ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-orange-500'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-orange-500'
                    }`}
                  >
                    <Clock size={20} className="mx-auto mb-1" />
                    <div className="text-sm font-medium">Meal</div>
                    <div className="text-xs opacity-80">30 min</div>
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  step="5"
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(parseInt(e.target.value) || 15)}
                  className={`w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${isDark ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-gray-900 border-gray-300'} border`}
                />
              </div>

              <div className="flex gap-3 pt-2">
              <button
                  onClick={() => {
                    setShowAddBreakModal(false);
                    setSelectedDealerForBreak(null);
                    setSelectedBreakType('Break');
                    setSelectedDuration(15);
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-lg transition-colors ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
              >
                Cancel
              </button>
              <button
                  onClick={async () => {
                    if (selectedDealerForBreak) {
                      await handleSendToBreak(selectedDealerForBreak.id, selectedBreakType, selectedDuration);
                      setShowAddBreakModal(false);
                      setSelectedDealerForBreak(null);
                      setSelectedBreakType('Break');
                      setSelectedDuration(15);
                    }
                  }}
                  disabled={!selectedDealerForBreak || availableDealers.length === 0}
                  className={`flex-1 px-4 py-2.5 rounded-lg transition-colors ${
                    !selectedDealerForBreak || availableDealers.length === 0
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
              >
                Send to Break
              </button>
            </div>
          </div>
          </GlassCard>
        </div>
      )}
      </div>
    </div>
  );
}
