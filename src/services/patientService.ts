import { invoke } from "@tauri-apps/api/core";
import type { Patient, CreatePatientDTO, UpdatePatientDTO, CentroPoblado, SearchResult } from "@/types";
import type { ApiResponse } from "@/types/api";
import { API_COMMANDS } from "@/utils/constants";

export const patientService = {
  async list(token: string, query?: string, page?: number, pageSize?: number): Promise<SearchResult<Patient>> {
    const res = await invoke<ApiResponse<SearchResult<Patient>>>(API_COMMANDS.SEARCH_PATIENTS, {
      token,
      query: query || "",
      page: page || 1,
      pageSize: pageSize || 20,
    });
    if (!res.success) throw new Error(res.message);
    return res.data!;
  },

  async getById(token: string, id: number): Promise<Patient> {
    const res = await invoke<ApiResponse<Patient>>(API_COMMANDS.GET_PATIENT, { token, id });
    if (!res.success) throw new Error(res.message);
    return res.data!;
  },

  async create(token: string, dto: CreatePatientDTO): Promise<Patient> {
    const res = await invoke<ApiResponse<Patient>>(API_COMMANDS.CREATE_PATIENT, { token, dto });
    if (!res.success) throw new Error(res.message);
    return res.data!;
  },

  async update(token: string, id: number, dto: UpdatePatientDTO): Promise<Patient> {
    // Rust UpdatePatientDTO requires id inside the DTO struct, so include it
    const res = await invoke<ApiResponse<Patient>>(API_COMMANDS.UPDATE_PATIENT, {
      token,
      id,
      dto: { ...dto, id },
    });
    if (!res.success) throw new Error(res.message);
    return res.data!;
  },

  async deactivate(token: string, id: number): Promise<void> {
    const res = await invoke<ApiResponse<null>>(API_COMMANDS.DEACTIVATE_PATIENT, { token, id });
    if (!res.success) throw new Error(res.message);
  },

  async listCentrosPoblados(token: string): Promise<CentroPoblado[]> {
    const res = await invoke<ApiResponse<CentroPoblado[]>>(API_COMMANDS.LIST_CENTROS_POBLADOS, { token });
    if (!res.success) throw new Error(res.message);
    return res.data!;
  },
};
