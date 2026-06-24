import { create } from "zustand";
import { patientService } from "@/services/patientService";
import { useAuthStore } from "@/stores/authStore";
import type { Patient, CreatePatientDTO, UpdatePatientDTO, CentroPoblado } from "@/types";
import { PAGINATION } from "@/utils/constants";

interface PatientState {
  // List state
  patients: Patient[];
  total: number;
  page: number;
  pageSize: number;
  searchQuery: string;
  loading: boolean;
  error: string | null;

  // Detail state
  selectedPatient: Patient | null;
  loadingDetail: boolean;

  // Centros poblados
  centrosPoblados: CentroPoblado[];
  loadingCentros: boolean;

  // Actions
  loadPatients: (query?: string, page?: number) => Promise<void>;
  createPatient: (dto: CreatePatientDTO) => Promise<Patient>;
  updatePatient: (id: number, dto: UpdatePatientDTO) => Promise<void>;
  loadPatient: (id: number) => Promise<void>;
  deactivatePatient: (id: number) => Promise<void>;
  loadCentrosPoblados: () => Promise<void>;
  setPage: (page: number) => void;
  setSearchQuery: (query: string) => void;
  clearError: () => void;
}

export const usePatientStore = create<PatientState>((set, get) => ({
  // Initial state
  patients: [],
  total: 0,
  page: 1,
  pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
  searchQuery: "",
  loading: false,
  error: null,
  selectedPatient: null,
  loadingDetail: false,
  centrosPoblados: [],
  loadingCentros: false,

  loadPatients: async (query?: string, page?: number) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ error: "No hay sesión activa", loading: false });
      return;
    }

    set({ loading: true, error: null });
    const currentState = get();
    const searchQuery = query !== undefined ? query : currentState.searchQuery;
    const pageNum = page !== undefined ? page : currentState.page;

    try {
      const result = await patientService.list(token, searchQuery, pageNum, currentState.pageSize);
      set({
        patients: result.data,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        searchQuery,
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar pacientes";
      set({ error: message, loading: false });
    }
  },

  createPatient: async (dto: CreatePatientDTO): Promise<Patient> => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error("No hay sesión activa");

    set({ loading: true, error: null });
    try {
      const patient = await patientService.create(token, dto);
      // Refresh list after creation
      const state = get();
      await state.loadPatients(state.searchQuery, 1);
      set({ loading: false });
      return patient;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al crear paciente";
      set({ error: message, loading: false });
      throw err;
    }
  },

  updatePatient: async (id: number, dto: UpdatePatientDTO): Promise<void> => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error("No hay sesión activa");

    set({ loading: true, error: null });
    try {
      await patientService.update(token, id, dto);
      // Refresh list and detail
      const state = get();
      await state.loadPatients(state.searchQuery, state.page);
      set({ loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al actualizar paciente";
      set({ error: message, loading: false });
      throw err;
    }
  },

  loadPatient: async (id: number) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ error: "No hay sesión activa", loadingDetail: false });
      return;
    }

    set({ loadingDetail: true, error: null, selectedPatient: null });
    try {
      const patient = await patientService.getById(token, id);
      set({ selectedPatient: patient, loadingDetail: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar paciente";
      set({ error: message, loadingDetail: false });
    }
  },

  deactivatePatient: async (id: number) => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error("No hay sesión activa");

    set({ loading: true, error: null });
    try {
      await patientService.deactivate(token, id);
      // Refresh list and clear detail if it was the deactivated patient
      const state = get();
      await state.loadPatients(state.searchQuery, state.page);
      if (state.selectedPatient?.id === id) {
        set({ selectedPatient: null });
      }
      set({ loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al desactivar paciente";
      set({ error: message, loading: false });
      throw err;
    }
  },

  loadCentrosPoblados: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ loadingCentros: true });
    try {
      const centros = await patientService.listCentrosPoblados(token);
      set({ centrosPoblados: centros, loadingCentros: false });
    } catch {
      set({ loadingCentros: false });
    }
  },

  setPage: (page: number) => {
    set({ page });
    const state = get();
    state.loadPatients(state.searchQuery, page);
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  clearError: () => set({ error: null }),
}));
