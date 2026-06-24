export type TreatmentStatus = "activo" | "completado" | "suspendido";

export interface Treatment {
  id: number;
  pacienteId: number;
  medicamentoId: number;
  fechaInicio: string;
  fechaFin?: string;
  dosis: string;
  frecuencia: string;
  duracionDias: number;
  estado: TreatmentStatus;
  observaciones?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTreatmentDTO {
  pacienteId: number;
  medicamentoId: number;
  fechaInicio: string;
  dosis: string;
  frecuencia: string;
  duracionDias: number;
  observaciones?: string;
}

export interface Medicamento {
  id: number;
  nombre: string;
  descripcion?: string;
  presentacion?: string;
  activo?: boolean;
}
