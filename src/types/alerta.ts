export type TipoAlerta = 'HEMOGLOBINA_CRITICA' | 'CONTROL_VENCIDO' | 'TRATAMIENTO_VENCIDO';

export interface Alerta {
  id: number;
  pacienteId: number;
  pacienteNombre: string;
  tipo: TipoAlerta;
  descripcion: string;
  fecha: string;
  resuelta: boolean;
}
