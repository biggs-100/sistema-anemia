import { invoke } from "@tauri-apps/api/core";
import type { Alerta } from "@/types";
import type { ApiResponse } from "@/types/api";
import type { SearchResult } from "@/types/patient";
import { API_COMMANDS } from "@/utils/constants";

export const alertaService = {
  async list(
    token: string,
    page?: number,
    pageSize?: number,
    tipo?: string,
    resuelta?: boolean,
  ): Promise<SearchResult<Alerta>> {
    const res = await invoke<ApiResponse<SearchResult<Alerta>>>(API_COMMANDS.LIST_ALERTAS, {
      token,
      page: page || 1,
      pageSize: pageSize || 20,
      tipo: tipo || null,
      resuelta: resuelta !== undefined ? resuelta : null,
    });
    if (!res.success) throw new Error(res.message);
    return res.data!;
  },

  async resolve(token: string, id: number): Promise<void> {
    const res = await invoke<ApiResponse<null>>(API_COMMANDS.RESOLVER_ALERTA, { token, id });
    if (!res.success) throw new Error(res.message);
  },

  async resolveAll(token: string): Promise<number> {
    const res = await invoke<ApiResponse<number>>(API_COMMANDS.RESOLVER_TODAS_ALERTAS, { token });
    if (!res.success) throw new Error(res.message);
    return res.data!;
  },
};
