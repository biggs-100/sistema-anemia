export interface User {
  id: number;
  usuario: string;
  nombres: string;
  apellidos: string;
  rolId: number;
  rolNombre: string;
  activo: boolean;
}

export interface LoginDTO {
  usuario: string;
  password: string;
}

export interface CreateUserDTO {
  usuario: string;
  password: string;
  nombres: string;
  apellidos: string;
  rolId: number;
}

export interface UpdateUserDTO {
  nombres?: string;
  apellidos?: string;
  rolId?: number;
  activo?: boolean;
}
