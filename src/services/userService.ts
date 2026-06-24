import { invoke } from "@tauri-apps/api/core";
import type { User, CreateUserDTO } from "@/types/user";
import type { ApiResponse } from "@/types/api";
import { API_COMMANDS } from "@/utils/constants";

export const userService = {
  async list(token: string): Promise<User[]> {
    const res = await invoke<ApiResponse<User[]>>(API_COMMANDS.LIST_USERS, { token });
    if (!res.success) throw new Error(res.message);
    return res.data!;
  },

  async create(token: string, dto: CreateUserDTO): Promise<User> {
    const res = await invoke<ApiResponse<User>>(API_COMMANDS.CREATE_USER, { token, dto });
    if (!res.success) throw new Error(res.message);
    return res.data!;
  },

  async deactivate(token: string, id: number): Promise<void> {
    const res = await invoke<ApiResponse<null>>(API_COMMANDS.DEACTIVATE_USER, { token, id });
    if (!res.success) throw new Error(res.message);
  },
};
