export interface DashboardStats {
  totalPacientes: number;
  controlesMes: number;
  tratamientosActivos: number;
  alertasPendientes: number;
  casosSeveros: number;
  distribucionHb: HbDistribucion[];
  evolucionMensual: EvolucionMensual[];
  alertasRecientes: AlertaResumen[];
  // Advanced stats (Batch 2)
  tasaRecuperacion: number;
  tratamientoMasEfectivo: TratamientoEfectivo | null;
}

export interface TratamientoEfectivo {
  nombre: string;
  total: number;
  tasaExito: number;
}

export interface HbDistribucion {
  clasificacion: "normal" | "leve" | "moderada" | "severa";
  cantidad: number;
}

export interface EvolucionMensual {
  mes: string;
  promedioHb: number;
  totalControles: number;
}

export interface AlertaResumen {
  id: number;
  pacienteId: number;
  tipo: string;
  descripcion: string;
  fecha: string;
}
