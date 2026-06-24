import { invoke } from "@tauri-apps/api/core";
import type { ApiResponse, User, LoginDTO } from "@/types";
import { API_COMMANDS } from "@/utils/constants";

export const authService = {
  async login(dto: LoginDTO): Promise<User> {
    const response = await invoke<ApiResponse<User>>(API_COMMANDS.LOGIN, {
      dto,
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message ?? "Error al iniciar sesión");
  },

  async logout(): Promise<void> {
    await invoke<ApiResponse<null>>(API_COMMANDS.LOGOUT);
  },

  async currentUser(): Promise<User> {
    const response = await invoke<ApiResponse<User>>(API_COMMANDS.CURRENT_USER);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message ?? "No se pudo obtener el usuario actual");
  },
};
