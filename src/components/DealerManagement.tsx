import { useState, useEffect } from 'react';
import { Dealer, Employee } from '../models';
import { DealerStatus, ContractType } from '../enums';
import { Users, Plus, Trash2, Search, Edit, X, Upload } from 'lucide-react';
import { DealerService } from '../services';
import AddDealerModal from './AddDealerModal';
import Breadcrumb from './Breadcrumb';
import { useThemeStore } from '../stores/themeStore';
import GlassCard from './GlassCard';

interface DealerWithEmployee extends Dealer {
  employee: Employee;
}

export default function DealerManagement() {
  const { isDark } = useThemeStore();
  const [dealers, setDealers] = useState<DealerWithEmployee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<DealerWithEmployee | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string>('');
  const dealerService = new DealerService();

  useEffect(() => {
    loadDealers();
  }, []);

  const loadDealers = async () => {
    try {
      const dealersData = await dealerService.getAllDealers();
      setDealers(dealersData);
    } catch (error) {
      console.error('Error loading dealers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDealers = dealers.filter(dealer => {
    const matchesSearch = dealer.employee?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dealer.employee?.employeeNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || dealer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: DealerStatus) => {
    switch (status) {
      case DealerStatus.Available: return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      case DealerStatus.Dealing: return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case DealerStatus.OnBreak: return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      case DealerStatus.OnMeal: return 'bg-orange-500/20 text-orange-300 border border-orange-500/30';
      case DealerStatus.OffShift: return 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
      case DealerStatus.SentHome: return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
    }
  };

  const handleDeleteDealer = async () => {
    if (!selectedDealer) return;
    try {
      await dealerService.deleteDealer(selectedDealer.id);
      setShowDeleteModal(false);
      setSelectedDealer(null);
      await loadDealers();
    } catch (error) {
      console.error('Error deleting dealer:', error);
    }
  };

  const handleStatusChange = async (dealerId: number, newStatus: DealerStatus) => {
    try {
      await dealerService.updateStatus(dealerId, newStatus);
      await loadDealers();
    } catch (error) {
      console.error('Error updating dealer status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading dealers...</div>
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
                <Users className={isDark ? 'text-blue-400' : 'text-blue-600'} size={28} />
              </div>
              Dealer Management
            </h2>
            <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Manage casino dealers and their assignments</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-[#FA812F] hover:bg-[#E6721A] text-white  flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
          >
            <Plus size={20} />
            Add Dealer
          </button>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} size={20} />
            <input
              type="text"
              placeholder="Search dealers by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-12 pr-4 py-3  border focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-6 py-3  border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <option value="all">All Status</option>
            {Object.values(DealerStatus).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredDealers.map((dealer) => (
            <GlassCard key={dealer.id} className="p-5 relative overflow-hidden group" hover={true}>
              <div className={`absolute top-0 right-0 w-32 h-32 ${isDark ? 'bg-gradient-to-br from-blue-500/5 to-purple-500/5' : 'bg-gradient-to-br from-blue-100/50 to-purple-100/50'} -mr-16 -mt-16 blur-2xl`}></div>
              
              <div className="relative">
                <div className="flex items-start gap-3 mb-4">
                  <div className="relative">
                    <img 
                      src={dealer.profileImage || '/images/dealer.png'} 
                      alt={dealer.employee?.fullName}
                      className="w-14 h-14 rounded-full object-cover shadow-lg"
                    />
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${dealer.status === DealerStatus.Available ? 'bg-green-500' : dealer.status === DealerStatus.Dealing ? 'bg-blue-500' : 'bg-amber-500'} border-2 ${isDark ? 'border-slate-900' : 'border-white'}`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-base font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{dealer.employee?.fullName || 'Unknown'}</h3>
                    <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{dealer.employee?.employeeNumber || 'N/A'}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold mt-1 ${getStatusColor(dealer.status)}`}>
                      {dealer.status}
                    </span>
                  </div>
                </div>

                <div className={`space-y-2 py-3 border-t border-b mb-3 ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Seniority Level</span>
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{dealer.seniorityLevel}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Certifications</span>
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{dealer.certifications?.length || 0} Games</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedDealer(dealer);
                      setShowEditModal(true);
                    }}
                    className="flex-1 px-3 py-2 bg-[#FA812F] hover:bg-[#E6721A] text-white text-xs font-medium transition-all flex items-center justify-center gap-1.5 shadow-lg"
                    title="Edit dealer"
                  >
                    <Edit size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDealer(dealer);
                      setShowDeleteModal(true);
                    }}
                    className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs transition-all"
                    title="Delete dealer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {filteredDealers.length === 0 && (
          <GlassCard className="text-center py-16" hover={false}>
            <div className={`p-4  w-20 h-20 mx-auto mb-4 flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
              <Users className={`w-10 h-10 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>No dealers found</h3>
            <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              {searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Get started by adding your first dealer'}
            </p>
          </GlassCard>
        )}

        {showAddModal && (
          <AddDealerModal
            onClose={() => setShowAddModal(false)}
            onSuccess={loadDealers}
          />
        )}

        {showEditModal && selectedDealer && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 p-8 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Edit Dealer</h3>
                <button onClick={() => { setShowEditModal(false); setSelectedDealer(null); setEditImagePreview(''); }} className="text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const { getDatabase, saveDatabase } = await import('../utils/database');
                const db = await getDatabase();
                const dealers = db.tables.get('Dealers') || [];
                const dealerIndex = dealers.findIndex((d: any) => d.id === selectedDealer.id);
                if (dealerIndex !== -1) {
                  dealers[dealerIndex].seniorityLevel = Number(formData.get('seniorityLevel'));
                  dealers[dealerIndex].contractType = formData.get('contractType');
                  dealers[dealerIndex].shiftStart = formData.get('shiftStart') + ':00';
                  dealers[dealerIndex].shiftEnd = formData.get('shiftEnd') + ':00';
                  if (editImagePreview) {
                    dealers[dealerIndex].profileImage = editImagePreview;
                  }
                  dealers[dealerIndex].updatedAt = new Date();
                  saveDatabase();
                }
                setEditImagePreview('');
                setShowEditModal(false);
                setSelectedDealer(null);
                await loadDealers();
              }} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Profile Image</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                      <img 
                        src={editImagePreview || selectedDealer.profileImage || '/images/dealer.png'} 
                        alt={selectedDealer.employee?.fullName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <label className="flex-1 cursor-pointer">
                      <div className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all text-center">
                        Choose Image
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setEditImagePreview(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Employee Number</label>
                  <input
                    type="text"
                    defaultValue={selectedDealer.employee?.employeeNumber}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 text-slate-400 cursor-not-allowed"
                    disabled
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">First Name</label>
                    <input
                      type="text"
                      defaultValue={selectedDealer.employee?.firstName}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 text-slate-400 cursor-not-allowed"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Last Name</label>
                    <input
                      type="text"
                      defaultValue={selectedDealer.employee?.lastName}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 text-slate-400 cursor-not-allowed"
                      disabled
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Seniority Level</label>
                    <input
                      type="number"
                      name="seniorityLevel"
                      defaultValue={selectedDealer.seniorityLevel}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      min="1"
                      max="20"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Contract Type</label>
                    <select
                      name="contractType"
                      defaultValue={selectedDealer.contractType || ContractType.FullTime}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      required
                    >
                      {Object.values(ContractType).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Shift Start</label>
                    <input
                      type="time"
                      name="shiftStart"
                      defaultValue={selectedDealer.shiftStart?.substring(0, 5)}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Shift End</label>
                    <input
                      type="time"
                      name="shiftEnd"
                      defaultValue={selectedDealer.shiftEnd?.substring(0, 5)}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                  <select
                    value={selectedDealer.status}
                    onChange={(e) => {
                      handleStatusChange(selectedDealer.id, e.target.value as DealerStatus);
                      setSelectedDealer({...selectedDealer, status: e.target.value as DealerStatus});
                    }}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    {Object.values(DealerStatus).map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowEditModal(false); setSelectedDealer(null); setEditImagePreview(''); }}
                    className="px-6 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#FA812F] hover:bg-[#E6721A] text-white transition-all shadow-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDeleteModal && selectedDealer && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <GlassCard className="p-6 max-w-md w-full" hover={false}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-500/20">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Delete Dealer</h3>
              </div>
              <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                Are you sure you want to delete <span className="font-semibold">{selectedDealer.employee?.fullName}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedDealer(null);
                  }}
                  className={`flex-1 px-4 py-2 transition-all ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteDealer}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white transition-all"
                >
                  Delete
                </button>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}
