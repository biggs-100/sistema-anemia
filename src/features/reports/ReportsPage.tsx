import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAuthStore } from "@/stores/authStore";
import { API_COMMANDS } from "@/utils/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReportType {
  id: string;
  title: string;
  description: string;
  formats: ("PDF" | "Excel" | "CSV")[];
}

const REPORT_TYPES: ReportType[] = [
  {
    id: "patients",
    title: "Pacientes Registrados",
    description: "Listado completo de pacientes con datos generales y estado",
    formats: ["PDF", "Excel", "CSV"],
  },
  {
    id: "controls",
    title: "Controles por Mes",
    description: "Historial de controles de hemoglobina agrupados por mes",
    formats: ["PDF", "Excel", "CSV"],
  },
  {
    id: "anemia",
    title: "Casos de Anemia",
    description: "Reporte de pacientes clasificados por tipo de anemia",
    formats: ["PDF", "Excel", "CSV"],
  },
  {
    id: "treatments",
    title: "Tratamientos Activos",
    description: "Tratamientos actualmente activos en el sistema",
    formats: ["PDF", "Excel"],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReportsPage() {
  const token = useAuthStore((s) => s.token);
  const [generating, setGenerating] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  const handleGenerate = async (reportId: string, format: string) => {
    if (!token) return;

    setGenerating(`${reportId}-${format}`);
    setMessage(null);

    try {
      if (format === "CSV") {
        // C3: CSV works with backend's generate_csv(reportId) command
        const path = await invoke<string>(API_COMMANDS.GENERATE_CSV, {
          token,
          tipo: reportId,
        });
        setMessage(`Reporte CSV generado: ${path.split('/').pop() || path.split('\\').pop()}`);
        setMessageType("success");
      } else if (format === "PDF") {
        // PDF needs a specific patient ID — show guidance
        setMessage(`Seleccione un paciente desde su ficha clínica para generar un PDF individual.`);
        setMessageType("info");
      } else if (format === "Excel") {
        // Excel needs a date range — show guidance
        setMessage(`Use la opción CSV para exportar datos, o seleccione un rango de fechas en la sección de reportes avanzados.`);
        setMessageType("info");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al generar reporte";
      if (msg.includes("not yet implemented") || msg.includes("no implementada") || msg.includes("próximamente")) {
        setMessage(`La generación de reportes estará disponible próximamente.`);
        setMessageType("info");
      } else {
        setMessage(msg);
        setMessageType("error");
      }
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Reportes</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Genere reportes del sistema en PDF, Excel o CSV
        </p>
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`rounded-lg border p-4 ${
            messageType === "success"
              ? "border-green-200 bg-green-50"
              : messageType === "error"
                ? "border-red-200 bg-red-50"
                : "border-blue-200 bg-blue-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <p
              className={`text-sm ${
                messageType === "success"
                  ? "text-green-700"
                  : messageType === "error"
                    ? "text-red-700"
                    : "text-blue-700"
              }`}
            >
              {message}
            </p>
            <button onClick={() => setMessage(null)} className="text-sm opacity-60 hover:opacity-100">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Report type cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {REPORT_TYPES.map((report) => (
          <div
            key={report.id}
            className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <h3 className="text-lg font-semibold text-neutral-900">{report.title}</h3>
            <p className="mt-1 text-sm text-neutral-500">{report.description}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {report.formats.map((fmt) => {
                const isGenerating = generating === `${report.id}-${fmt}`;
                return (
                  <button
                    key={fmt}
                    onClick={() => handleGenerate(report.id, fmt)}
                    disabled={isGenerating}
                    className={`rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      fmt === "PDF"
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : fmt === "Excel"
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-neutral-600 text-white hover:bg-neutral-700"
                    }`}
                  >
                    {isGenerating ? (
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        ...
                      </span>
                    ) : (
                      fmt
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
