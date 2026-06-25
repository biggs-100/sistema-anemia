export interface Visita {
  id: number;
  pacienteId: number;
  pacienteNombre: string | null;
  fechaVisita: string;
  responsable: string | null;
  resultado: string | null;
  observaciones: string | null;
}

export interface CreateVisitaDTO {
  pacienteId: number;
  fechaVisita: string;
  responsable?: string;
  resultado?: string;
  observaciones?: string;
}

export type ResultadoVisita = "Encontrado" | "Ausente" | "Reagendado";
