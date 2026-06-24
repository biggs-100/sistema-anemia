export interface User {
  id: number;
  usuario: string;
  nombres: string;
  apellidos: string;
  email?: string;
  rolId: number;
  rolNombre?: string;
  activo?: boolean;
  ultimoAcceso?: string;
  createdAt?: string;
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
  email?: string;
  rolId: number;
}

export interface UpdateUserDTO {
  nombres?: string;
  apellidos?: string;
  email?: string;
  rolId?: number;
  activo?: boolean;
}
