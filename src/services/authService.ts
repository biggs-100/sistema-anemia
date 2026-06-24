import { invoke } from "@tauri-apps/api/core";
import type { User } from "@/types/user";

interface LoginResponse {
  token: string;
  user: User;
}

export const authService = {
  async login(usuario: string, password: string): Promise<LoginResponse> {
    const response = await invoke<{ success: boolean; message: string; data?: LoginResponse }>(
      "login",
      { usuario, password },
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message ?? "Error al iniciar sesión");
  },

  async logout(token: string): Promise<void> {
    const response = await invoke<{ success: boolean; message: string }>(
      "logout",
      { token },
    );
    if (!response.success) {
      throw new Error(response.message ?? "Error al cerrar sesión");
    }
  },

  async currentUser(token: string): Promise<User> {
    const response = await invoke<{ success: boolean; message: string; data?: User }>(
      "current_user",
      { token },
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message ?? "No se pudo obtener el usuario actual");
  },

  async changePassword(
    token: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const response = await invoke<{ success: boolean; message: string }>(
      "change_password",
      { token, oldPassword, newPassword },
    );
    if (!response.success) {
      throw new Error(response.message ?? "Error al cambiar contraseña");
    }
  },
};
