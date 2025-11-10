import { useState, useEffect } from 'react';
import { getDatabase, saveDatabase } from '../utils/database';
import { Dealer, BreakRecord } from '../models';
import { DealerStatus } from '../enums';
import { Coffee, Clock, Play, Plus, Users } from 'lucide-react';
import Breadcrumb from './Breadcrumb';
import { useThemeStore } from '../stores/themeStore';

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
    return `${diffMins}m`;
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`backdrop-blur-lg  p-4 shadow-sm ${isDark ? 'bg-white/10' : 'bg-white'}`}>
          <div className="flex items-center gap-3">
            <Coffee className={isDark ? 'text-yellow-400' : 'text-yellow-600'} size={24} />
            <div>
              <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>On Break</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {dealersOnBreak.filter(b => b.breakType === 'Break').length}
              </p>
            </div>
          </div>
        </div>

        <div className={`backdrop-blur-lg  p-4 shadow-sm ${isDark ? 'bg-white/10' : 'bg-white'}`}>
          <div className="flex items-center gap-3">
            <Clock className={isDark ? 'text-orange-400' : 'text-orange-600'} size={24} />
            <div>
              <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>On Meal</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {dealersOnBreak.filter(b => b.breakType === 'Meal').length}
              </p>
            </div>
          </div>
        </div>

        <div className={`backdrop-blur-lg  p-4 shadow-sm ${isDark ? 'bg-white/10' : 'bg-white'}`}>
          <div className="flex items-center gap-3">
            <Users className="text-green-400" size={24} />
            <div>
              <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>Available</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{availableDealers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Breaks */}
      <div className={`backdrop-blur-lg  p-6 shadow-sm ${isDark ? 'bg-white/10' : 'bg-white'}`}>
        <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Current Breaks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dealersOnBreak.map((breakRecord) => (
            <div key={breakRecord.id} className={` p-4 shadow-sm ${isDark ? 'bg-white/5' : 'bg-white'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <img 
                    src={breakRecord.dealer?.profileImage || '/images/dealer.png'} 
                    alt={breakRecord.dealer?.employee.fullName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {breakRecord.dealer?.employee.fullName || 'Unknown Dealer'}
                    </h4>
                    <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>{breakRecord.breakType}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleReturnFromBreak(breakRecord.id)}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors flex items-center gap-1"
                >
                  <Play size={14} />
                  Return
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-white/70' : 'text-gray-600'}>Duration:</span>
                  <span className={isDark ? 'text-white' : 'text-gray-900'}>{calculateBreakTime(breakRecord.startTime)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-white/70' : 'text-gray-600'}>Expected:</span>
                  <span className={isDark ? 'text-white' : 'text-gray-900'}>{breakRecord.expectedDurationMinutes}m</span>
                </div>
                <div className="w-full bg-white/20  h-2">
                  <div
                    className="bg-purple-500 h-2  transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (parseInt(calculateBreakTime(breakRecord.startTime)) / breakRecord.expectedDurationMinutes) * 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {dealersOnBreak.length === 0 && (
          <div className="text-center py-8">
            <Coffee className="mx-auto h-12 w-12 text-white/30" />
            <h3 className="mt-2 text-sm font-medium text-white">No dealers on break</h3>
            <p className="mt-1 text-sm text-white/50">All dealers are working or available</p>
          </div>
        )}
      </div>

      {/* Available Dealers */}
      <div className={`backdrop-blur-lg  p-6 shadow-sm ${isDark ? 'bg-white/10' : 'bg-white'}`}>
        <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Available Dealers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableDealers.map((dealer) => (
            <div key={dealer.id} className={` p-4 shadow-sm ${isDark ? 'bg-white/5' : 'bg-white'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <img 
                    src={dealer.profileImage || '/images/dealer.png'} 
                    alt={dealer.employee.fullName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{dealer.employee.fullName}</h4>
                    <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>{dealer.employee.employeeNumber}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSendToBreak(dealer.id, 'Break', 15)}
                    className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded transition-colors"
                  >
                    Break
                  </button>
                  <button
                    onClick={() => handleSendToBreak(dealer.id, 'Meal', 30)}
                    className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded transition-colors"
                  >
                    Meal
                  </button>
                </div>
              </div>

              <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                Seniority: {dealer.seniorityLevel}
              </div>
            </div>
          ))}
        </div>

        {availableDealers.length === 0 && (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-white/30" />
            <h3 className="mt-2 text-sm font-medium text-white">No available dealers</h3>
            <p className="mt-1 text-sm text-white/50">All dealers are currently assigned or on break</p>
          </div>
        )}
      </div>

      {/* Add Break Modal - Placeholder */}
      {showAddBreakModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800  p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Send Dealer to Break</h3>
            <p className="text-white/70 mb-4">Quick break assignment coming soon...</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddBreakModal(false)}
                className="px-4 py-2 text-white/70 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddBreakModal(false)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white  transition-colors"
              >
                Send to Break
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
