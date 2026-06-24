import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { EvolucionMensual } from "@/types/dashboard";

interface MonthlyEvolutionChartProps {
  data: EvolucionMensual[];
}

function formatMonth(mes: string): string {
  const [year, month] = mes.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("es-PE", { month: "short", year: "2-digit" });
}

interface TooltipPayloadEntry {
  payload: EvolucionMensual;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0].payload;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-lg">
      <p className="text-xs font-medium text-neutral-500">
        {formatMonth(entry.mes)}
      </p>
      <p className="mt-1 text-sm font-semibold text-neutral-900">
        Hb Promedio: {entry.promedioHb.toFixed(1)} g/dL
      </p>
      <p className="text-xs text-neutral-500">
        {entry.totalControles} control(es)
      </p>
    </div>
  );
}

export default function MonthlyEvolutionChart({
  data,
}: MonthlyEvolutionChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50">
        <p className="text-sm text-neutral-400">
          No hay datos de evolución mensual
        </p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    mesLabel: formatMonth(d.mes),
  }));

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <h4 className="mb-4 text-sm font-semibold text-neutral-700">
        Evolución Mensual de Hemoglobina
      </h4>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="mesLabel"
            stroke="#9ca3af"
            fontSize={11}
            interval={1}
            tickMargin={4}
          />
          <YAxis
            domain={[0, 15]}
            stroke="#9ca3af"
            fontSize={12}
            tickFormatter={(val: number) => `${val}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={11}
            stroke="#16A34A"
            strokeDasharray="6 4"
            strokeWidth={2}
            label={{
              value: "Normal (≥11)",
              position: "right",
              fontSize: 11,
              fill: "#16A34A",
            }}
          />
          <Line
            type="monotone"
            dataKey="promedioHb"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
