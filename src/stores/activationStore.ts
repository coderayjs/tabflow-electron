import { create } from 'zustand';

interface ActivationState {
  isActivated: boolean;
  companyName: string | null;
  licenseKey: string | null;
  activate: (companyName: string, licenseKey: string) => Promise<boolean>;
  checkActivation: () => void;
  deactivate: () => void;
}

export const useActivationStore = create<ActivationState>((set) => ({
  isActivated: false,
  companyName: null,
  licenseKey: null,

  activate: async (companyName: string, licenseKey: string) => {
    try {
      // Demo/Test license keys (for development)
      const validLicenseKeys = [
        'DEMO-2024-TABL-FLO',
        'TEST-2024-TABL-FLO',
        'XXXX-XXXX-XXXX-XXXX' // Accepts placeholder format for demo
      ];
      
      // Normalize license key for comparison
      const normalizedKey = licenseKey.trim().toUpperCase();
      
      // For demo purposes, accept any key that matches the format or is in the valid list
      // In production, this would validate against a server
      const isValidFormat = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalizedKey);
      const isValidKey = validLicenseKeys.includes(normalizedKey) || isValidFormat;
      
      if (!isValidKey) {
        return false;
      }
      
      // Simulate activation validation delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store activation info
      localStorage.setItem('tableflo_activated', 'true');
      localStorage.setItem('tableflo_company', companyName);
      localStorage.setItem('tableflo_license', normalizedKey);
      
      set({ 
        isActivated: true, 
        companyName,
        licenseKey: normalizedKey 
      });
      
      return true;
    } catch (error) {
      console.error('Activation error:', error);
      return false;
    }
  },

  checkActivation: () => {
    const activated = localStorage.getItem('tableflo_activated');
    const company = localStorage.getItem('tableflo_company');
    const license = localStorage.getItem('tableflo_license');
    
    if (activated === 'true' && company && license) {
      set({ 
        isActivated: true, 
        companyName: company,
        licenseKey: license 
      });
    }
  },

  deactivate: () => {
    localStorage.removeItem('tableflo_activated');
    localStorage.removeItem('tableflo_company');
    localStorage.removeItem('tableflo_license');
    set({ 
      isActivated: false, 
      companyName: null,
      licenseKey: null 
    });
  },
}));

