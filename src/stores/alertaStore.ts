import { create } from "zustand";
import { alertaService } from "@/services/alertaService";
import { useAuthStore } from "@/stores/authStore";
import type { Alerta, TipoAlerta } from "@/types";
import { PAGINATION } from "@/utils/constants";

interface AlertaFilters {
  tipo: TipoAlerta | "";
  resuelta: boolean | null;
}

interface AlertaState {
  alertas: Alerta[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  filters: AlertaFilters;

  loadAlertas: (page?: number) => Promise<void>;
  resolveAlerta: (id: number) => Promise<void>;
  resolveAll: () => Promise<void>;
  setPage: (page: number) => void;
  setFilter: (filters: Partial<AlertaFilters>) => void;
  clearError: () => void;
}

export const useAlertaStore = create<AlertaState>((set, get) => ({
  alertas: [],
  total: 0,
  page: 1,
  pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
  loading: false,
  error: null,
  filters: { tipo: "", resuelta: null },

  loadAlertas: async (page?: number) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ error: "No hay sesión activa", loading: false });
      return;
    }

    set({ loading: true, error: null });
    const state = get();
    const pageNum = page !== undefined ? page : state.page;

    try {
      const result = await alertaService.list(
        token,
        pageNum,
        state.pageSize,
        state.filters.tipo || undefined,
        state.filters.resuelta !== null ? state.filters.resuelta : undefined,
      );
      set({
        alertas: result.data,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar alertas";
      set({ error: message, loading: false });
    }
  },

  resolveAlerta: async (id: number) => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error("No hay sesión activa");

    try {
      await alertaService.resolve(token, id);
      // Refresh list
      const state = get();
      await state.loadAlertas(state.page);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al resolver alerta";
      set({ error: message });
      throw err;
    }
  },

  resolveAll: async () => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error("No hay sesión activa");

    try {
      const count = await alertaService.resolveAll(token);
      // Refresh list
      const state = get();
      await state.loadAlertas(1);
      return count;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al resolver alertas";
      set({ error: message });
      throw err;
    }
  },

  setPage: (page: number) => {
    set({ page });
    get().loadAlertas(page);
  },

  setFilter: (filters: Partial<AlertaFilters>) => {
    const current = get().filters;
    const newFilters = { ...current, ...filters };
    set({ filters: newFilters, page: 1 });
    get().loadAlertas(1);
  },

  clearError: () => set({ error: null }),
}));
