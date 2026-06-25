import { create } from "zustand";
import { visitaService } from "@/services/visitaService";
import { useAuthStore } from "@/stores/authStore";
import type { Visita, CreateVisitaDTO } from "@/types";

interface VisitaState {
  visitas: Visita[];
  loading: boolean;
  error: string | null;

  loadVisitas: (pacienteId: number) => Promise<void>;
  createVisita: (dto: CreateVisitaDTO) => Promise<Visita>;
  clearVisitas: () => void;
  clearError: () => void;
}

export const useVisitaStore = create<VisitaState>((set, get) => ({
  visitas: [],
  loading: false,
  error: null,

  loadVisitas: async (pacienteId: number) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ error: "No hay sesión activa", loading: false });
      return;
    }

    set({ loading: true, error: null });
    try {
      const visitas = await visitaService.getByPaciente(token, pacienteId);
      set({ visitas, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar visitas";
      set({ error: message, loading: false });
    }
  },

  createVisita: async (dto: CreateVisitaDTO): Promise<Visita> => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error("No hay sesión activa");

    set({ loading: true, error: null });
    try {
      const visita = await visitaService.create(token, dto);
      // Refresh list after creation
      const state = get();
      await state.loadVisitas(dto.pacienteId);
      set({ loading: false });
      return visita;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al crear visita";
      set({ error: message, loading: false });
      throw err;
    }
  },

  clearVisitas: () => {
    set({
      visitas: [],
      loading: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
