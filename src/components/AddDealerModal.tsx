import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { AuthenticationService } from '../services';
import { DealerService } from '../services';
import { ContractType } from '../enums';

interface AddDealerModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddDealerModal({ onClose, onSuccess }: AddDealerModalProps) {
  const [formData, setFormData] = useState({
    employeeNumber: '',
    firstName: '',
    lastName: '',
    password: 'dealer123',
    seniorityLevel: 1,
    contractType: ContractType.FullTime,
    shiftStart: '08:00',
    shiftEnd: '16:00',
    certifications: [] as string[],
    profileImage: '/images/dealer.png'
  });
  const [imagePreview, setImagePreview] = useState<string>('/images/dealer.png');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setFormData(prev => ({ ...prev, profileImage: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const gameTypes = ['Blackjack', 'Roulette', 'Craps', 'Baccarat', 'Poker'];

  const toggleCertification = (game: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.includes(game)
        ? prev.certifications.filter(g => g !== game)
        : [...prev.certifications, game]
    }));
  };
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const authService = new AuthenticationService();
      const dealerService = new DealerService();
      
      // Create employee first
      const employee = await authService.registerEmployee(
        formData.employeeNumber,
        formData.firstName,
        formData.lastName,
        formData.password,
        'Dealer'
      );
      
      // Then create dealer record with certifications
      const dealer = await dealerService.createDealer(
        employee.id,
        formData.seniorityLevel,
        formData.shiftStart + ':00',
        formData.shiftEnd + ':00'
      );

      // Save profile image and contract type
      if (formData.profileImage || formData.contractType) {
        const { getDatabase, saveDatabase } = await import('../utils/database');
        const db = await getDatabase();
        const dealers = db.tables.get('Dealers') || [];
        const dealerIndex = dealers.findIndex((d: any) => d.id === dealer.id);
        if (dealerIndex !== -1) {
          if (formData.profileImage) dealers[dealerIndex].profileImage = formData.profileImage;
          dealers[dealerIndex].contractType = formData.contractType;
          db.tables.set('Dealers', dealers);
          saveDatabase();
        }
      }

      // Add certifications
      if (formData.certifications.length > 0) {
        const { getDatabase, saveDatabase } = await import('../utils/database');
        const db = await getDatabase();
        const certifications = db.tables.get('DealerCertifications') || [];
        
        formData.certifications.forEach((gameType, index) => {
          certifications.push({
            id: Math.max(0, ...certifications.map((c: any) => c.id)) + index + 1,
            dealerId: dealer.id,
            gameType,
            proficiencyLevel: 'Intermediate',
            certifiedDate: new Date(),
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          });
        });
        
        db.tables.set('DealerCertifications', certifications);
        saveDatabase();
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating dealer:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800  p-8 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">Add New Dealer</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Profile Image</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-8 h-8 text-slate-600" />
                )}
              </div>
              <label className="flex-1 cursor-pointer">
                <div className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all text-center">
                  Choose Image
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Employee Number</label>
            <input
              type="text"
              value={formData.employeeNumber}
              onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700  text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="e.g., DEAL009"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700  text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700  text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Seniority Level</label>
              <input
                type="number"
                value={formData.seniorityLevel}
                onChange={(e) => setFormData({ ...formData, seniorityLevel: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700  text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                min="1"
                max="20"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Contract Type</label>
              <select
                value={formData.contractType}
                onChange={(e) => setFormData({ ...formData, contractType: e.target.value as ContractType })}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700  text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
                value={formData.shiftStart}
                onChange={(e) => setFormData({ ...formData, shiftStart: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700  text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Shift End</label>
              <input
                type="time"
                value={formData.shiftEnd}
                onChange={(e) => setFormData({ ...formData, shiftEnd: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700  text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Game Certifications</label>
            <div className="grid grid-cols-2 gap-2">
              {gameTypes.map(game => (
                <label key={game} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.certifications.includes(game)}
                    onChange={() => toggleCertification(game)}
                    className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-700 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-300">{game}</span>
                </label>
              ))}
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
              {loading ? 'Creating...' : 'Create Dealer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
