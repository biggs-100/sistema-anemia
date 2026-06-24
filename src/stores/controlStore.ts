import { create } from "zustand";
import { controlService } from "@/services/controlService";
import { useAuthStore } from "@/stores/authStore";
import type { Control, CreateControlDTO } from "@/types";
import { PAGINATION } from "@/utils/constants";

interface ControlState {
  controls: Control[];
  total: number;
  page: number;
  pageSize: number;
  currentPacienteId: number | null;
  loading: boolean;
  error: string | null;

  loadControls: (pacienteId: number, page?: number) => Promise<void>;
  createControl: (dto: CreateControlDTO) => Promise<Control>;
  setPage: (page: number) => void;
  clearControls: () => void;
  clearError: () => void;
}

export const useControlStore = create<ControlState>((set, get) => ({
  controls: [],
  total: 0,
  page: 1,
  pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
  currentPacienteId: null,
  loading: false,
  error: null,

  loadControls: async (pacienteId: number, page?: number) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ error: "No hay sesión activa", loading: false });
      return;
    }

    set({ loading: true, error: null, currentPacienteId: pacienteId });
    const currentState = get();
    const pageNum = page !== undefined ? page : currentState.page;

    try {
      const result = await controlService.getByPaciente(
        token,
        pacienteId,
        pageNum,
        currentState.pageSize,
      );
      set({
        controls: result.data,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar controles";
      set({ error: message, loading: false });
    }
  },

  createControl: async (dto: CreateControlDTO): Promise<Control> => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error("No hay sesión activa");

    set({ loading: true, error: null });
    try {
      const control = await controlService.create(token, dto);
      // Refresh list after creation
      const state = get();
      await state.loadControls(dto.pacienteId, 1);
      set({ loading: false });
      return control;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al crear control";
      set({ error: message, loading: false });
      throw err;
    }
  },

  setPage: (page: number) => {
    const state = get();
    if (state.currentPacienteId !== null) {
      set({ page });
      state.loadControls(state.currentPacienteId, page);
    }
    // If no patient selected, silently ignore page change
  },

  clearControls: () => {
    set({
      controls: [],
      total: 0,
      page: 1,
      currentPacienteId: null,
      loading: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
