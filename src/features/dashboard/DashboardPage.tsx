import { useDashboardStats } from "./hooks/useDashboardStats";
import KpiGrid from "./components/KpiGrid";
import DistributionChart from "./components/DistributionChart";
import MonthlyEvolutionChart from "./components/MonthlyEvolutionChart";
import RecentAlertsList from "./components/RecentAlertsList";
import type { TratamientoEfectivo } from "@/types/dashboard";

// ---------------------------------------------------------------------------
// Advanced Stats Card
// ---------------------------------------------------------------------------
function RecoveryRateCard({ rate }: { rate: number }) {
  const color =
    rate >= 60 ? "text-green-600 dark:text-green-400" :
    rate >= 40 ? "text-amber-500 dark:text-amber-400" :
    "text-red-600 dark:text-red-400";

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800">
      <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
        Tasa de Recuperación (6m)
      </p>
      <p className={`mt-1 text-3xl font-bold ${color}`}>
        {rate.toFixed(1)}%
      </p>
      <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
        Pacientes que normalizaron Hb en los últimos 6 meses
      </p>
    </div>
  );
}

function BestTreatmentCard({ treatment }: { treatment: TratamientoEfectivo | null }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800">
      <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
        Tratamiento Más Efectivo
      </p>
      {treatment ? (
        <>
          <p className="mt-1 text-xl font-bold text-blue-600 dark:text-blue-400">
            {treatment.nombre}
          </p>
          <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
            {treatment.tasaExito.toFixed(1)}% de éxito · {treatment.total}{" "}
            paciente{treatment.total !== 1 ? "s" : ""}
          </p>
        </>
      ) : (
        <p className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">
          Sin datos suficientes
        </p>
      )}
    </div>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700 ${className ?? "h-24"}`}
    />
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      {/* KPIs skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28" />
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SkeletonBlock className="h-[350px]" />
        <SkeletonBlock className="h-[350px]" />
      </div>

      {/* Alerts skeleton */}
      <SkeletonBlock className="h-48" />
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-red-800">
            Error al cargar el dashboard
          </h3>
          <p className="mt-1 text-sm text-red-600">{message}</p>
        </div>
        <button
          onClick={onRetry}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { stats, loading, error, refresh } = useDashboardStats();

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Dashboard</h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Resumen del sistema de seguimiento
          </p>
        </div>
        <ErrorState message={error} onRetry={refresh} />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Dashboard</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Resumen del sistema de seguimiento
        </p>
      </div>

      {/* KPI Cards */}
      <KpiGrid stats={stats} />

      {/* Advanced Stats (Batch 2) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <RecoveryRateCard rate={stats.tasaRecuperacion} />
        <BestTreatmentCard treatment={stats.tratamientoMasEfectivo} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DistributionChart data={stats.distribucionHb} />
        <MonthlyEvolutionChart data={stats.evolucionMensual} />
      </div>

      {/* Recent Alerts */}
      <RecentAlertsList alerts={stats.alertasRecientes} />
    </div>
  );
}
