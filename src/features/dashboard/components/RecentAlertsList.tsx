import type { AlertaResumen } from "@/types/dashboard";

interface RecentAlertsListProps {
  alerts: AlertaResumen[];
}

const TIPO_BADGE: Record<string, string> = {
  critico: "bg-red-100 text-red-800",
  seguimiento: "bg-yellow-100 text-yellow-800",
  informativo: "bg-blue-100 text-blue-800",
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
      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h4 className="mb-2 text-sm font-semibold text-neutral-700">
          Alertas Recientes
        </h4>
        <p className="text-sm text-neutral-400">No hay alertas pendientes</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <h4 className="mb-4 text-sm font-semibold text-neutral-700">
        Alertas Recientes
      </h4>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-start gap-3 rounded-md border border-neutral-100 bg-neutral-50 p-3"
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
                <span className="text-xs text-neutral-400">
                  {formatDate(alert.fecha)}
                </span>
              </div>
              <p className="mt-1 text-sm text-neutral-700 line-clamp-2">
                {alert.descripcion}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
