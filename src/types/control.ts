export type ClasificacionAnemia = "normal" | "leve" | "moderada" | "severa";

export interface Control {
  id: number;
  pacienteId: number;
  fechaControl: string;
  edadMeses: number | null;
  peso: number;
  talla: number;
  hemoglobina: number;
  clasificacion: ClasificacionAnemia;
  temperatura: number | null;
  observaciones: string | null;
  usuarioId: number;
  creadoEn: string;
}

export interface CreateControlDTO {
  pacienteId: number;
  fechaControl: string;
  peso: number;
  talla: number;
  hemoglobina: number;
  temperatura?: number;
  observaciones?: string;
}

export interface UpdateControlDTO {
  id: number;
  fechaControl?: string;
  peso?: number;
  talla?: number;
  hemoglobina?: number;
  temperatura?: number;
  observaciones?: string;
}
