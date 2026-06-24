import { invoke } from "@tauri-apps/api/core";
import type { Backup } from "@/types";
import type { ApiResponse } from "@/types/api";
import { API_COMMANDS } from "@/utils/constants";

export const backupService = {
  async list(token: string): Promise<Backup[]> {
    const res = await invoke<ApiResponse<Backup[]>>(API_COMMANDS.LIST_BACKUPS, { token });
    if (!res.success) throw new Error(res.message);
    return res.data!;
  },

  async create(token: string): Promise<Backup> {
    const res = await invoke<ApiResponse<Backup>>(API_COMMANDS.CREATE_BACKUP, { token });
    if (!res.success) throw new Error(res.message);
    return res.data!;
  },

  async restore(token: string, id: number): Promise<void> {
    const res = await invoke<ApiResponse<null>>(API_COMMANDS.RESTORE_BACKUP, { token, id });
    if (!res.success) throw new Error(res.message);
  },
};
