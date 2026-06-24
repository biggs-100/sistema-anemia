import { create } from 'zustand';
import { treatmentService } from '@/services/treatmentService';
import { useAuthStore } from '@/stores/authStore';
import type { Treatment, CreateTreatmentDTO, Medicamento } from '@/types';

interface TreatmentState {
  treatments: Treatment[];
  medicamentos: Medicamento[];
  currentPacienteId: number | null;
  loading: boolean;
  error: string | null;

  loadTreatments: (pacienteId: number) => Promise<void>;
  createTreatment: (dto: CreateTreatmentDTO) => Promise<Treatment>;
  finishTreatment: (id: number) => Promise<void>;
  suspendTreatment: (id: number) => Promise<void>;
  loadMedicamentos: () => Promise<void>;
  clearTreatments: () => void;
  clearError: () => void;
}

export const useTreatmentStore = create<TreatmentState>((set, get) => ({
  treatments: [],
  medicamentos: [],
  currentPacienteId: null,
  loading: false,
  error: null,

  loadTreatments: async (pacienteId: number) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ error: 'No hay sesión activa', loading: false });
      return;
    }

    set({ loading: true, error: null, currentPacienteId: pacienteId });

    try {
      const treatments = await treatmentService.getByPaciente(token, pacienteId);
      set({ treatments, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar tratamientos';
      set({ error: message, loading: false });
    }
  },

  createTreatment: async (dto: CreateTreatmentDTO): Promise<Treatment> => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error('No hay sesión activa');

    set({ loading: true, error: null });
    try {
      const treatment = await treatmentService.create(token, dto);
      // Refresh list after creation
      const state = get();
      if (state.currentPacienteId) {
        await state.loadTreatments(state.currentPacienteId);
      }
      set({ loading: false });
      return treatment;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear tratamiento';
      set({ error: message, loading: false });
      throw err;
    }
  },

  finishTreatment: async (id: number) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ error: 'No hay sesión activa', loading: false });
      return;
    }

    set({ loading: true, error: null });
    try {
      await treatmentService.finish(token, id);
      // Refresh list
      const state = get();
      if (state.currentPacienteId) {
        await state.loadTreatments(state.currentPacienteId);
      }
      set({ loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al finalizar tratamiento';
      set({ error: message, loading: false });
    }
  },

  suspendTreatment: async (id: number) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ error: 'No hay sesión activa', loading: false });
      return;
    }

    set({ loading: true, error: null });
    try {
      await treatmentService.suspend(token, id);
      // Refresh list
      const state = get();
      if (state.currentPacienteId) {
        await state.loadTreatments(state.currentPacienteId);
      }
      set({ loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al suspender tratamiento';
      set({ error: message, loading: false });
    }
  },

  loadMedicamentos: async () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ error: 'No hay sesión activa', loading: false });
      return;
    }

    try {
      const medicamentos = await treatmentService.listMedicamentos(token);
      set({ medicamentos, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar medicamentos';
      set({ error: message });
    }
  },

  clearTreatments: () => {
    set({
      treatments: [],
      currentPacienteId: null,
      loading: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
