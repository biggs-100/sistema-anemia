import type { AlertaResumen } from "@/types/dashboard";

interface RecentAlertsListProps {
  alerts: AlertaResumen[];
}

const TIPO_BADGE: Record<string, string> = {
  critico: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  seguimiento: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  informativo: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
};

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function RecentAlertsList({ alerts }: RecentAlertsListProps) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        <h4 className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          Alertas Recientes
        </h4>
        <p className="text-sm text-neutral-400 dark:text-neutral-500">No hay alertas pendientes</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
      <h4 className="mb-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
        Alertas Recientes
      </h4>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-start gap-3 rounded-md border border-neutral-100 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/50"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    TIPO_BADGE[alert.tipo] ?? "bg-neutral-100 text-neutral-700"
                  }`}
                >
                  {alert.tipo}
                </span>
                <span className="text-xs text-neutral-400 dark:text-neutral-500">
                  {formatDate(alert.fecha)}
                </span>
              </div>
              <p className="mt-1 text-sm text-neutral-700 line-clamp-2 dark:text-neutral-300">
                {alert.descripcion}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
