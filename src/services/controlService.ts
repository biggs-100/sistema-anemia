import { invoke } from "@tauri-apps/api/core";
import type { Control, CreateControlDTO, UpdateControlDTO } from "@/types";
import { API_COMMANDS } from "@/utils/constants";

export const controlService = {
  async createControl(token: string, dto: CreateControlDTO): Promise<Control> {
    const response = await invoke<{ success: boolean; message: string; data?: Control }>(
      API_COMMANDS.CREATE_CONTROL,
      { token, dto },
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message ?? "Error al crear control");
  },

  async updateControl(token: string, id: number, dto: UpdateControlDTO): Promise<Control> {
    const response = await invoke<{ success: boolean; message: string; data?: Control }>(
      API_COMMANDS.UPDATE_CONTROL,
      { token, id, dto },
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message ?? "Error al actualizar control");
  },

  async getControls(token: string, pacienteId: number): Promise<Control[]> {
    const response = await invoke<{ success: boolean; message: string; data?: Control[] }>(
      API_COMMANDS.GET_CONTROLS,
      { token, pacienteId },
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message ?? "Error al obtener controles");
  },
};
