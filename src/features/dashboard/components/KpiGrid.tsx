import StatCard from "./StatCard";
import type { DashboardStats } from "@/types/dashboard";

interface KpiGridProps {
  stats: DashboardStats;
}

export default function KpiGrid({ stats }: KpiGridProps) {
  const cards = [
    {
      title: "Total Pacientes",
      value: stats.totalPacientes,
      color: "text-blue-600",
    },
    {
      title: "Controles del Mes",
      value: stats.controlesMes,
      color: "text-green-600",
    },
    {
      title: "Tratamientos Activos",
      value: stats.tratamientosActivos,
      color: "text-amber-500",
    },
    {
      title: "Alertas Pendientes",
      value: stats.alertasPendientes,
      color: "text-red-600",
    },
    {
      title: "Casos Severos (3m)",
      value: stats.casosSeveros,
      color: "text-red-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <StatCard
          key={card.title}
          title={card.title}
          value={card.value}
          color={card.color}
        />
      ))}
    </div>
  );
}
