import { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { GameType, TableStatus } from '../enums';
import { TableService } from '../services';

interface AddTableModalProps {
  onClose: () => void;
  onSuccess: () => void;
  table?: any;
}

export default function AddTableModal({ onClose, onSuccess, table }: AddTableModalProps) {
  const [formData, setFormData] = useState({
    tableNumber: table?.tableNumber || '',
    gameType: table?.gameType || GameType.Blackjack,
    minBet: table?.minBet || 10,
    maxBet: table?.maxBet || 500,
    pit: table?.pit || 'Main Floor',
    requiredDealerCount: table?.requiredDealerCount || 1,
    pushIntervalMinutes: table?.pushIntervalMinutes || 20
  });
  const [tableImage, setTableImage] = useState(table?.tableImage || '/images/casinotable.jpeg');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTableImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const tableService = new TableService();
      if (table) {
        await tableService.updateTable(table.id, { ...formData, tableImage });
      } else {
        await tableService.createTable({ ...formData, tableImage });
      }
      setShowSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error saving table:', error);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800  p-8 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">{table ? 'Edit Table' : 'Add New Table'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Table Photo</label>
            <div className="flex items-center gap-4">
              <img 
                src={tableImage} 
                alt="Table"
                className="w-20 h-20 rounded object-cover"
              />
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm transition-all border border-slate-700"
              >
                Select Photo
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Table Number</label>
            <input
              type="text"
              value={formData.tableNumber}
              onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700  text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="e.g., BJ-101"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Game Type</label>
            <select
              value={formData.gameType}
              onChange={(e) => setFormData({ ...formData, gameType: e.target.value as GameType })}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700  text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {Object.values(GameType).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Min Bet ($)</label>
              <input
                type="number"
                value={formData.minBet}
                onChange={(e) => setFormData({ ...formData, minBet: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700  text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Max Bet ($)</label>
              <input
                type="number"
                value={formData.maxBet}
                onChange={(e) => setFormData({ ...formData, maxBet: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700  text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Pit Location</label>
            <input
              type="text"
              value={formData.pit}
              onChange={(e) => setFormData({ ...formData, pit: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700  text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="e.g., Main Floor"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Dealers Needed</label>
              <input
                type="number"
                value={formData.requiredDealerCount}
                onChange={(e) => setFormData({ ...formData, requiredDealerCount: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700  text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Push Interval (min)</label>
              <input
                type="number"
                value={formData.pushIntervalMinutes}
                onChange={(e) => setFormData({ ...formData, pushIntervalMinutes: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700  text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                min="5"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800  transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#FA812F] hover:bg-[#E6721A] text-white  transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? (table ? 'Updating...' : 'Creating...') : (table ? 'Update Table' : 'Create Table')}
            </button>
          </div>
        </form>
      </div>

      {showSuccess && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white font-semibold">{table ? 'Table Updated Successfully!' : 'Table Created Successfully!'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
