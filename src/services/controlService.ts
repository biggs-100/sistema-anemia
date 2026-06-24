import { invoke } from "@tauri-apps/api/core";
import type { ApiResponse, Control, CreateControlDTO, UpdateControlDTO } from "@/types";
import { API_COMMANDS } from "@/utils/constants";

export const controlService = {
  async createControl(dto: CreateControlDTO): Promise<Control> {
    const response = await invoke<ApiResponse<Control>>(API_COMMANDS.CREATE_CONTROL, {
      dto,
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message ?? "Error al crear control");
  },

  async updateControl(id: number, dto: UpdateControlDTO): Promise<Control> {
    const response = await invoke<ApiResponse<Control>>(API_COMMANDS.UPDATE_CONTROL, {
      id,
      dto,
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message ?? "Error al actualizar control");
  },

  async getControls(pacienteId: number): Promise<Control[]> {
    const response = await invoke<ApiResponse<Control[]>>(API_COMMANDS.GET_CONTROLS, {
      pacienteId,
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message ?? "Error al obtener controles");
  },
};
