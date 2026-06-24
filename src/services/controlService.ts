import { invoke } from "@tauri-apps/api/core";
import type { Control, CreateControlDTO, SearchResult } from "@/types";
import type { ApiResponse } from "@/types/api";
import { API_COMMANDS } from "@/utils/constants";

export const controlService = {
  async getByPaciente(
    token: string,
    pacienteId: number,
    page?: number,
    pageSize?: number,
  ): Promise<SearchResult<Control>> {
    const res = await invoke<ApiResponse<SearchResult<Control>>>(API_COMMANDS.GET_CONTROLS, {
      token,
      pacienteId,
      page: page ?? 1,
      pageSize: pageSize ?? 20,
    });
    if (!res.success) throw new Error(res.message);
    return res.data!;
  },

  async create(token: string, dto: CreateControlDTO): Promise<Control> {
    const res = await invoke<ApiResponse<Control>>(API_COMMANDS.CREATE_CONTROL, { token, dto });
    if (!res.success) throw new Error(res.message);
    return res.data!;
  },

  async getByDateRange(
    token: string,
    pacienteId: number,
    inicio: string,
    fin: string,
  ): Promise<Control[]> {
    const res = await invoke<ApiResponse<Control[]>>(API_COMMANDS.GET_CONTROLS_BY_DATE_RANGE, {
      token,
      pacienteId,
      inicio,
      fin,
    });
    if (!res.success) throw new Error(res.message);
    return res.data!;
  },
};
