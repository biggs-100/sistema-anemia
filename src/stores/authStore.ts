import { create } from "zustand";
import type { User } from "@/types/user";
import { authService } from "@/services/authService";

// C2: Persist token across app restarts via localStorage
const TOKEN_STORAGE_KEY = "sistema_anemia_token";

function loadStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // localStorage unavailable — in-memory only
  }
}

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
  token: loadStoredToken(),
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (usuario: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(usuario, password);
      saveToken(response.token);
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
      saveToken(null);
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  checkSession: async () => {
    const { token } = get();
    if (!token) {
      set({ isAuthenticated: false, user: null, isLoading: false });
      return;
    }
    set({ isLoading: true });
    try {
      // Validate the stored token against the backend
      const user = await authService.currentUser(token);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      // Token expired or invalid — clear everything
      saveToken(null);
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
