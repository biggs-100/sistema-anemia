import { invoke } from "@tauri-apps/api/core";
import type { Patient, CreatePatientDTO, UpdatePatientDTO } from "@/types";
import { API_COMMANDS } from "@/utils/constants";

export const patientService = {
  async createPatient(token: string, dto: CreatePatientDTO): Promise<Patient> {
    const response = await invoke<{ success: boolean; message: string; data?: Patient }>(
      API_COMMANDS.CREATE_PATIENT,
      { token, dto },
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message ?? "Error al crear paciente");
  },

  async updatePatient(token: string, id: number, dto: UpdatePatientDTO): Promise<Patient> {
    const response = await invoke<{ success: boolean; message: string; data?: Patient }>(
      API_COMMANDS.UPDATE_PATIENT,
      { token, id, dto },
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message ?? "Error al actualizar paciente");
  },

  async getPatient(token: string, id: number): Promise<Patient> {
    const response = await invoke<{ success: boolean; message: string; data?: Patient }>(
      API_COMMANDS.GET_PATIENT,
      { token, id },
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message ?? "Paciente no encontrado");
  },

  async searchPatients(token: string, query: string): Promise<Patient[]> {
    const response = await invoke<{ success: boolean; message: string; data?: Patient[] }>(
      API_COMMANDS.SEARCH_PATIENTS,
      { token, query },
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message ?? "Error al buscar pacientes");
  },

  async deactivatePatient(token: string, id: number): Promise<void> {
    const response = await invoke<{ success: boolean; message: string }>(
      API_COMMANDS.DEACTIVATE_PATIENT,
      { token, id },
    );
    if (!response.success) {
      throw new Error(response.message ?? "Error al desactivar paciente");
    }
  },
};
