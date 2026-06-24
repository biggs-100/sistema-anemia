import { invoke } from '@tauri-apps/api/core';
import type { Treatment, CreateTreatmentDTO, Medicamento } from '@/types';
import type { ApiResponse } from '@/types/api';
import { API_COMMANDS } from '@/utils/constants';

export const treatmentService = {
  async getByPaciente(token: string, pacienteId: number): Promise<Treatment[]> {
    const res = await invoke<ApiResponse<Treatment[]>>(
      API_COMMANDS.GET_TREATMENTS,
      { token, pacienteId },
    );
    if (!res.success) throw new Error(res.message);
    return res.data!;
  },

  async create(token: string, dto: CreateTreatmentDTO): Promise<Treatment> {
    const res = await invoke<ApiResponse<Treatment>>(
      API_COMMANDS.CREATE_TREATMENT,
      { token, dto },
    );
    if (!res.success) throw new Error(res.message);
    return res.data!;
  },

  async finish(token: string, id: number): Promise<Treatment> {
    const res = await invoke<ApiResponse<Treatment>>(
      API_COMMANDS.FINISH_TREATMENT,
      { token, id },
    );
    if (!res.success) throw new Error(res.message);
    return res.data!;
  },

  async suspend(token: string, id: number): Promise<Treatment> {
    const res = await invoke<ApiResponse<Treatment>>(
      API_COMMANDS.SUSPEND_TREATMENT,
      { token, id },
    );
    if (!res.success) throw new Error(res.message);
    return res.data!;
  },

  async listMedicamentos(token: string): Promise<Medicamento[]> {
    const res = await invoke<ApiResponse<Medicamento[]>>(
      API_COMMANDS.LIST_MEDICAMENTOS,
      { token },
    );
    if (!res.success) throw new Error(res.message);
    return res.data!;
  },
};
