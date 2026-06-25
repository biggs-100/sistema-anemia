import { invoke } from "@tauri-apps/api/core";
import type { Visita, CreateVisitaDTO } from "@/types";
import type { ApiResponse } from "@/types/api";
import { API_COMMANDS } from "@/utils/constants";

export const visitaService = {
  async create(token: string, dto: CreateVisitaDTO): Promise<Visita> {
    const res = await invoke<ApiResponse<Visita>>(API_COMMANDS.CREATE_VISITA, {
      token,
      pacienteId: dto.pacienteId,
      fechaVisita: dto.fechaVisita,
      responsable: dto.responsable || null,
      resultado: dto.resultado || null,
      observaciones: dto.observaciones || null,
    });
    if (!res.success) throw new Error(res.message);
    return res.data!;
  },

  async getByPaciente(token: string, pacienteId: number): Promise<Visita[]> {
    const res = await invoke<ApiResponse<Visita[]>>(API_COMMANDS.GET_VISITAS, {
      token,
      pacienteId,
    });
    if (!res.success) throw new Error(res.message);
    return res.data!;
  },
};
