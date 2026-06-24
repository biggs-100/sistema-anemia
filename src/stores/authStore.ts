import { create } from "zustand";
import type { User } from "@/types/user";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;

  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  login: async (_username: string, _password: string) => {
    set({ loading: true, error: null });
    try {
      // Will integrate with authService.ts via invoke("login")
      // const response = await authService.login({ usuario: username, password });
      // set({ user: response, isAuthenticated: true, loading: false });

      // Placeholder for scaffolding
      set({ loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al iniciar sesión";
      set({ error: message, loading: false });
    }
  },

  logout: async () => {
    try {
      // await authService.logout();
      set({ user: null, isAuthenticated: false });
    } catch {
      set({ user: null, isAuthenticated: false });
    }
  },

  checkSession: async () => {
    try {
      // const user = await authService.currentUser();
      // set({ user, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
    }
  },

  clearError: () => set({ error: null }),
}));
