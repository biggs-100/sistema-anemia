import { create } from "zustand";
import { userService } from "@/services/userService";
import { useAuthStore } from "@/stores/authStore";
import type { User, CreateUserDTO } from "@/types/user";

interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;

  loadUsers: () => Promise<void>;
  createUser: (dto: CreateUserDTO) => Promise<User>;
  deactivateUser: (id: number) => Promise<void>;
  clearError: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  loading: false,
  error: null,

  loadUsers: async () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ error: "No hay sesión activa", loading: false });
      return;
    }

    set({ loading: true, error: null });
    try {
      const users = await userService.list(token);
      set({ users, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar usuarios";
      set({ error: message, loading: false });
    }
  },

  createUser: async (dto: CreateUserDTO): Promise<User> => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error("No hay sesión activa");

    set({ loading: true, error: null });
    try {
      const user = await userService.create(token, dto);
      // Refresh list
      await get().loadUsers();
      set({ loading: false });
      return user;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al crear usuario";
      set({ error: message, loading: false });
      throw err;
    }
  },

  deactivateUser: async (id: number) => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error("No hay sesión activa");

    set({ loading: true, error: null });
    try {
      await userService.deactivate(token, id);
      await get().loadUsers();
      set({ loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al desactivar usuario";
      set({ error: message, loading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
