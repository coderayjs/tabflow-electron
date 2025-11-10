import { create } from 'zustand';
import { Employee } from '../models';

interface AuthState {
  isAuthenticated: boolean;
  currentUser: Employee | null;
  login: (employeeNumber: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setCurrentUser: (user: Employee) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  currentUser: null,

  login: async (employeeNumber: string, password: string) => {
    try {
      // For web version, use direct service call
      const { AuthenticationService } = await import('../services/AuthenticationService');
      const authService = new AuthenticationService();

      const employee = await authService.authenticate(employeeNumber, password);
      if (employee) {
        set({ isAuthenticated: true, currentUser: employee });
        localStorage.setItem('currentUser', JSON.stringify(employee));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  },

  logout: async () => {
    localStorage.removeItem('currentUser');
    set({ isAuthenticated: false, currentUser: null });
  },

  checkAuth: async () => {
    // For web version, check local storage or just remain logged out
    // In a real app, you'd check for stored auth tokens
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        set({ isAuthenticated: true, currentUser: user });
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }
  },

  setCurrentUser: (user: Employee) => {
    set({ currentUser: user });
    localStorage.setItem('currentUser', JSON.stringify(user));
  },
}));

