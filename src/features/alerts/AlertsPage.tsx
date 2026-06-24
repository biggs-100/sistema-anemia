import { useState } from "react";

interface Alert {
  id: number;
  tipo: string;
  descripcion: string;
  fechaGenerada: string;
  pacienteNombre?: string;
  resuelta: boolean;
}

// Placeholder data for structure demonstration
const placeholderAlerts: Alert[] = [];

export default function AlertsPage() {
  const [filter, setFilter] = useState<"all" | "pending" | "resolved">("pending");

  // Tauri invoke calls will load real alerts:
  // useEffect(() => { invoke("get_alertas")... }, [])

  const filteredAlerts =
    filter === "all"
      ? placeholderAlerts
      : filter === "pending"
        ? placeholderAlerts.filter((a) => !a.resuelta)
        : placeholderAlerts.filter((a) => a.resuelta);

  const handleResolve = async (_alertId: number) => {
    // Tauri invoke("resolve_alerta", { id: alertId })
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Alertas</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Alertas y notificaciones del sistema
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {([
          { key: "pending", label: "Pendientes" },
          { key: "resolved", label: "Resueltas" },
          { key: "all", label: "Todas" },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-blue-600 text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts list */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center">
            <p className="text-sm text-neutral-400">
              {filter === "pending"
                ? "No hay alertas pendientes"
                : "No hay alertas registradas"}
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start justify-between rounded-lg border p-4 ${
                alert.resuelta
                  ? "border-neutral-200 bg-neutral-50"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      alert.tipo === "critica"
                        ? "bg-red-100 text-red-700"
                        : alert.tipo === "alerta"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {alert.tipo}
                  </span>
                  {!alert.resuelta && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      Pendiente
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-neutral-900">
                  {alert.descripcion}
                </p>
                <p className="text-xs text-neutral-500">
                  {alert.pacienteNombre} — {alert.fechaGenerada}
                </p>
              </div>

              {!alert.resuelta && (
                <button
                  onClick={() => handleResolve(alert.id)}
                  className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                >
                  Resolver
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
