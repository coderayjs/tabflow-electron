export interface ElectronAPI {
  login: (employeeNumber: string, password: string) => Promise<{ success: boolean; employee?: any; error?: string }>;
  getCurrentUser: () => Promise<any>;
  logout: () => Promise<{ success: boolean }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

