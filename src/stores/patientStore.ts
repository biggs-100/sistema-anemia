import { create } from "zustand";
import type { Patient, CreatePatientDTO } from "@/types/patient";

interface PatientState {
  patients: Patient[];
  selectedPatient: Patient | null;
  loading: boolean;
  error: string | null;

  loadPatients: () => Promise<void>;
  createPatient: (dto: CreatePatientDTO) => Promise<void>;
  searchPatients: (query: string) => Promise<void>;
  selectPatient: (patient: Patient | null) => void;
  clearError: () => void;
}

export const usePatientStore = create<PatientState>((set) => ({
  patients: [],
  selectedPatient: null,
  loading: false,
  error: null,

  loadPatients: async () => {
    set({ loading: true, error: null });
    try {
      // Will integrate with patientService.ts
      // const patients = await patientService.searchPatients("");
      // set({ patients, loading: false });
      set({ loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar pacientes";
      set({ error: message, loading: false });
    }
  },

  createPatient: async (_dto: CreatePatientDTO) => {
    set({ loading: true, error: null });
    try {
      // const patient = await patientService.createPatient(dto);
      // set((state) => ({ patients: [patient, ...state.patients], loading: false }));
      set({ loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al crear paciente";
      set({ error: message, loading: false });
    }
  },

  searchPatients: async (_query: string) => {
    set({ loading: true, error: null });
    try {
      // const patients = await patientService.searchPatients(query);
      // set({ patients, loading: false });
      set({ loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al buscar pacientes";
      set({ error: message, loading: false });
    }
  },

  selectPatient: (patient) => set({ selectedPatient: patient }),
  clearError: () => set({ error: null }),
}));
