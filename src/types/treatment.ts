export type TreatmentState = 'activo' | 'suspendido' | 'finalizado';

export interface Treatment {
  id: number;
  pacienteId: number;
  pacienteNombre: string;
  medicamentoId: number;
  medicamentoNombre: string;
  dosis: string;
  frecuencia: string;
  fechaInicio: string;
  fechaFin: string | null;
  estado: TreatmentState;
  observaciones: string | null;
}

export interface CreateTreatmentDTO {
  pacienteId: number;
  medicamentoId: number;
  dosis: string;
  frecuencia: string;
  fechaInicio: string;
  fechaFin?: string;
  observaciones?: string;
}

export interface Medicamento {
  id: number;
  nombre: string;
}
