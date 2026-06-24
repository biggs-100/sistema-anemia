import { useAuthStore } from "@/stores/authStore";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
}

function KpiCard({ title, value, subtitle, color }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">{title}</p>
          <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-neutral-400">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  // Tauri invoke() calls will load real data here:
  // const [stats, setStats] = useState(...)
  // useEffect(() => { invoke("get_dashboard_stats")... }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Dashboard</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Resumen del sistema de seguimiento
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Pacientes"
          value="—"
          subtitle="Pacientes registrados"
          color="text-blue-600"
        />
        <KpiCard
          title="Controles del Mes"
          value="—"
          subtitle="Controles realizados"
          color="text-green-600"
        />
        <KpiCard
          title="Tratamientos Activos"
          value="—"
          subtitle="En seguimiento"
          color="text-amber-500"
        />
        <KpiCard
          title="Alertas Pendientes"
          value="—"
          subtitle="Requieren atención"
          color="text-red-600"
        />
      </div>

      {/* Placeholder for future charts */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-900">
          Evolución de Hemoglobina
        </h3>
        <p className="mt-2 text-sm text-neutral-400">
          {/* Chart from recharts will render here */}
          Gráfico de evolución — próximamente
        </p>
      </div>
    </div>
  );
}
