import { invoke } from "@tauri-apps/api/core";
import type { ApiResponse, Patient, CreatePatientDTO, UpdatePatientDTO } from "@/types";
import { API_COMMANDS } from "@/utils/constants";

export const patientService = {
  async createPatient(dto: CreatePatientDTO): Promise<Patient> {
    const response = await invoke<ApiResponse<Patient>>(API_COMMANDS.CREATE_PATIENT, {
      dto,
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message ?? "Error al crear paciente");
  },

  async updatePatient(id: number, dto: UpdatePatientDTO): Promise<Patient> {
    const response = await invoke<ApiResponse<Patient>>(API_COMMANDS.UPDATE_PATIENT, {
      id,
      dto,
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message ?? "Error al actualizar paciente");
  },

  async getPatient(id: number): Promise<Patient> {
    const response = await invoke<ApiResponse<Patient>>(API_COMMANDS.GET_PATIENT, {
      id,
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message ?? "Paciente no encontrado");
  },

  async searchPatients(query: string): Promise<Patient[]> {
    const response = await invoke<ApiResponse<Patient[]>>(API_COMMANDS.SEARCH_PATIENTS, {
      query,
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message ?? "Error al buscar pacientes");
  },

  async deactivatePatient(id: number): Promise<void> {
    const response = await invoke<ApiResponse<null>>(API_COMMANDS.DEACTIVATE_PATIENT, {
      id,
    });
    if (!response.success) {
      throw new Error(response.message ?? "Error al desactivar paciente");
    }
  },
};
