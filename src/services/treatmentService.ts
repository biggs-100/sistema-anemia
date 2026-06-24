import { invoke } from "@tauri-apps/api/core";
import type { Treatment, CreateTreatmentDTO } from "@/types";
import { API_COMMANDS } from "@/utils/constants";

export const treatmentService = {
  async createTreatment(token: string, dto: CreateTreatmentDTO): Promise<Treatment> {
    const response = await invoke<{ success: boolean; message: string; data?: Treatment }>(
      API_COMMANDS.CREATE_TREATMENT,
      { token, dto },
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message ?? "Error al crear tratamiento");
  },

  async finishTreatment(token: string, id: number): Promise<Treatment> {
    const response = await invoke<{ success: boolean; message: string; data?: Treatment }>(
      API_COMMANDS.FINISH_TREATMENT,
      { token, id },
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message ?? "Error al finalizar tratamiento");
  },

  async getTreatments(token: string, pacienteId: number): Promise<Treatment[]> {
    const response = await invoke<{ success: boolean; message: string; data?: Treatment[] }>(
      API_COMMANDS.GET_TREATMENTS,
      { token, pacienteId },
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message ?? "Error al obtener tratamientos");
  },
};
