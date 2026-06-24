export type HemoglobinaClasificacion = "normal" | "leve" | "moderada" | "severa";

export interface Control {
  id: number;
  pacienteId: number;
  fechaControl: string;
  peso: number;
  talla: number;
  hemoglobina: number;
  hemoglobinaClasificacion: HemoglobinaClasificacion;
  temperatura?: number;
  dosisHierro?: string;
  observaciones?: string;
  usuarioId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateControlDTO {
  pacienteId: number;
  fechaControl: string;
  peso: number;
  talla: number;
  hemoglobina: number;
  temperatura?: number;
  dosisHierro?: string;
  observaciones?: string;
  usuarioId?: number;
}

export interface UpdateControlDTO {
  peso?: number;
  talla?: number;
  hemoglobina?: number;
  temperatura?: number;
  dosisHierro?: string;
  observaciones?: string;
}
