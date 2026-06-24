import { useDashboardStats } from "./hooks/useDashboardStats";
import KpiGrid from "./components/KpiGrid";
import DistributionChart from "./components/DistributionChart";
import MonthlyEvolutionChart from "./components/MonthlyEvolutionChart";
import RecentAlertsList from "./components/RecentAlertsList";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-neutral-200 ${className ?? "h-24"}`}
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
          <h2 className="text-2xl font-bold text-neutral-900">Dashboard</h2>
          <p className="mt-1 text-sm text-neutral-500">
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
        <h2 className="text-2xl font-bold text-neutral-900">Dashboard</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Resumen del sistema de seguimiento
        </p>
      </div>

      {/* KPI Cards */}
      <KpiGrid stats={stats} />

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
