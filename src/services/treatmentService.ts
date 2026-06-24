import { invoke } from "@tauri-apps/api/core";
import type { ApiResponse, Treatment, CreateTreatmentDTO } from "@/types";
import { API_COMMANDS } from "@/utils/constants";

export const treatmentService = {
  async createTreatment(dto: CreateTreatmentDTO): Promise<Treatment> {
    const response = await invoke<ApiResponse<Treatment>>(API_COMMANDS.CREATE_TREATMENT, {
      dto,
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message ?? "Error al crear tratamiento");
  },

  async finishTreatment(id: number): Promise<Treatment> {
    const response = await invoke<ApiResponse<Treatment>>(API_COMMANDS.FINISH_TREATMENT, {
      id,
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message ?? "Error al finalizar tratamiento");
  },

  async getTreatments(pacienteId: number): Promise<Treatment[]> {
    const response = await invoke<ApiResponse<Treatment[]>>(API_COMMANDS.GET_TREATMENTS, {
      pacienteId,
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message ?? "Error al obtener tratamientos");
  },
};
