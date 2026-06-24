export interface CentroPoblado {
  id: number;
  nombre: string;
  distrito: string;
  provincia: string;
  departamento: string;
}

export interface Patient {
  id: number;
  historiaClinica: string;
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  sexo: string;
  edad: string;
  centroPobladoId: number | null;
  centroPobladoNombre: string | null;
  nombreApoderado: string | null;
  celularApoderado: string | null;
  activo: boolean;
}

export interface CreatePatientDTO {
  historiaClinica: string;
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  sexo: string;
  centroPobladoId: number;
  nombreApoderado: string;
  celularApoderado?: string;
}

export type UpdatePatientDTO = CreatePatientDTO;

export interface SearchResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
