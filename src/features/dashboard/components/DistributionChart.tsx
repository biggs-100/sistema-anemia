import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { HbDistribucion } from "@/types/dashboard";

interface DistributionChartProps {
  data: HbDistribucion[];
}

const COLORS: Record<string, string> = {
  normal: "#16A34A",
  leve: "#F59E0B",
  moderada: "#F97316",
  severa: "#DC2626",
};

const LABELS: Record<string, string> = {
  normal: "Normal",
  leve: "Leve",
  moderada: "Moderada",
  severa: "Severa",
};

interface TooltipPayloadEntry {
  name: string;
  value: number;
  payload: { clasificacion: string };
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  const label = LABELS[entry.payload.clasificacion] ?? entry.payload.clasificacion;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-lg">
      <p className="text-sm font-semibold text-neutral-900">{label}</p>
      <p className="text-sm text-neutral-600">{entry.value} pacientes</p>
    </div>
  );
}

export default function DistributionChart({ data }: DistributionChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    name: LABELS[d.clasificacion] ?? d.clasificacion,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50">
        <p className="text-sm text-neutral-400">
          No hay datos de distribución disponibles
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <h4 className="mb-4 text-sm font-semibold text-neutral-700">
        Distribución por Clasificación
      </h4>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="cantidad"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={50}
            paddingAngle={2}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.clasificacion}
                fill={COLORS[entry.clasificacion] ?? "#6b7280"}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value: string) => (
              <span className="text-sm text-neutral-700">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
