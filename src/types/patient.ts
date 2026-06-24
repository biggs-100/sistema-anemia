export interface Patient {
  id: number;
  historiaClinica: string;
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  sexo: string;
  centroPobladoId?: number;
  activo?: boolean;
}

export interface CreatePatientDTO {
  historiaClinica: string;
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  sexo: string;
  direccion?: string;
  centroPobladoId?: number;
}

export interface UpdatePatientDTO {
  nombres?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  fechaNacimiento?: string;
  sexo?: string;
  direccion?: string;
  centroPobladoId?: number;
}
