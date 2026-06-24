import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import {
  classifyHemoglobina,
  getLabelForClassification,
} from "@/utils/classification";
import type { Control } from "@/types";
import type { HemoglobinaLevel } from "@/utils/classification";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface HbEvolutionChartProps {
  controls: Control[];
}

// ---------------------------------------------------------------------------
// Chart color map
// ---------------------------------------------------------------------------

const DOT_COLORS: Record<HemoglobinaLevel, string> = {
  normal: "#22c55e", // green-500
  leve: "#f59e0b", // amber-500
  moderada: "#f97316", // orange-500
  severa: "#ef4444", // red-500
};

const CLASSIFICATION_LABELS: Record<string, string> = {
  normal: "Normal",
  leve: "Leve",
  moderada: "Moderada",
  severa: "Severa",
};

// ---------------------------------------------------------------------------
// Custom dot renderer
// ---------------------------------------------------------------------------

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: { clasificacion: string };
}

function CustomDot({ cx, cy, payload }: CustomDotProps) {
  if (cx == null || cy == null || !payload) return null;
  const color = DOT_COLORS[payload.clasificacion as HemoglobinaLevel] ?? "#6b7280";
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={color}
      stroke="#fff"
      strokeWidth={2}
    />
  );
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

interface TooltipPayloadEntry {
  payload: {
    fechaControl: string;
    hemoglobina: number;
    clasificacion: string;
  };
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
  const label = CLASSIFICATION_LABELS[entry.clasificacion] ?? entry.clasificacion;
  const color = DOT_COLORS[entry.clasificacion as HemoglobinaLevel] ?? "#6b7280";
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-lg">
      <p className="text-xs text-neutral-500">
        {new Date(entry.fechaControl).toLocaleDateString("es-PE", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>
      <p className="mt-1 text-sm font-semibold text-neutral-900">
        Hb: {entry.hemoglobina.toFixed(1)} g/dL
      </p>
      <span
        className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
        style={{
          backgroundColor: `${color}20`,
          color,
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HbEvolutionChart({ controls }: HbEvolutionChartProps) {
  // Sort controls by fechaControl ascending and filter out null hemoglobina
  const chartData = useMemo(() => {
    return [...controls]
      .filter((c) => c.hemoglobina != null)
      .sort(
        (a, b) =>
          new Date(a.fechaControl).getTime() -
          new Date(b.fechaControl).getTime(),
      )
      .map((c) => ({
        fechaControl: c.fechaControl,
        hemoglobina: c.hemoglobina,
        clasificacion: c.clasificacion,
      }));
  }, [controls]);

  if (chartData.length < 2) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50">
        <p className="text-sm text-neutral-400">
          Se necesitan al menos 2 controles para mostrar la evolución
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <h4 className="mb-4 text-sm font-semibold text-neutral-700">
        Evolución de Hemoglobina
      </h4>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="fechaControl"
            tickFormatter={(val: string) =>
              new Date(val).toLocaleDateString("es-PE", {
                day: "2-digit",
                month: "2-digit",
              })
            }
            stroke="#9ca3af"
            fontSize={12}
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
            stroke="#22c55e"
            strokeDasharray="6 4"
            strokeWidth={2}
            label={{
              value: "Normal (≥11)",
              position: "right",
              fontSize: 11,
              fill: "#22c55e",
            }}
          />
          <ReferenceLine
            y={10}
            stroke="#f59e0b"
            strokeDasharray="6 4"
            strokeWidth={2}
            label={{
              value: "Leve (≥10)",
              position: "right",
              fontSize: 11,
              fill: "#f59e0b",
            }}
          />
          <ReferenceLine
            y={7}
            stroke="#ef4444"
            strokeDasharray="6 4"
            strokeWidth={2}
            label={{
              value: "Severa (<7)",
              position: "right",
              fontSize: 11,
              fill: "#ef4444",
            }}
          />
          <Line
            type="monotone"
            dataKey="hemoglobina"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
