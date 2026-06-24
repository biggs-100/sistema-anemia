import { create } from "zustand";
import type { User } from "@/types/user";
import { authService } from "@/services/authService";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (usuario: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (usuario: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(usuario, password);
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al iniciar sesión";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    const { token } = get();
    try {
      if (token) {
        await authService.logout(token);
      }
    } catch {
      // Clear local state even if API call fails
    } finally {
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  checkSession: async () => {
    const { token } = get();
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }
    set({ isLoading: true });
    try {
      const user = await authService.currentUser(token);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    const { token } = get();
    if (!token) throw new Error("No hay sesión activa");
    await authService.changePassword(token, oldPassword, newPassword);
  },

  clearError: () => set({ error: null }),
}));
