import { useState } from "react";

interface ReportType {
  id: string;
  title: string;
  description: string;
  icon: string;
  formats: string[];
}

const reportTypes: ReportType[] = [
  {
    id: "patients",
    title: "Reporte de Pacientes",
    description: "Listado completo de pacientes con datos generales y estado",
    icon: "👥",
    formats: ["PDF", "Excel", "CSV"],
  },
  {
    id: "controls",
    title: "Reporte de Controles",
    description: "Historial de controles de hemoglobina por paciente y rango de fechas",
    icon: "🩺",
    formats: ["PDF", "Excel", "CSV"],
  },
  {
    id: "treatments",
    title: "Reporte de Tratamientos",
    description: "Tratamientos activos, completados y suspendidos",
    icon: "💊",
    formats: ["PDF", "Excel"],
  },
  {
    id: "alerts",
    title: "Reporte de Alertas",
    description: "Alertas generadas y resueltas en un período",
    icon: "🔔",
    formats: ["PDF", "Excel"],
  },
  {
    id: "audit",
    title: "Reporte de Auditoría",
    description: "Registro de actividades y cambios en el sistema",
    icon: "📋",
    formats: ["PDF", "Excel"],
  },
];

export default function ReportsPage() {
  const [selectedFormat, setSelectedFormat] = useState<string>("PDF");

  // Tauri invoke("generate_pdf") or generate_excel will be called
  const handleGenerate = async (_reportId: string) => {
    // const response = await invoke("generate_pdf", { reportType: reportId });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Reportes</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Genere reportes del sistema en PDF, Excel o CSV
        </p>
      </div>

      {/* Format selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-neutral-700">Formato:</span>
        {["PDF", "Excel", "CSV"].map((fmt) => (
          <button
            key={fmt}
            onClick={() => setSelectedFormat(fmt)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedFormat === fmt
                ? "bg-blue-600 text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            {fmt}
          </button>
        ))}
      </div>

      {/* Report type cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report) => (
          <div
            key={report.id}
            className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-3 text-3xl" role="img" aria-hidden>
              {report.icon}
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">
              {report.title}
            </h3>
            <p className="mt-1 text-sm text-neutral-500">{report.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {report.formats.map((fmt) => (
                <span
                  key={fmt}
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    fmt === selectedFormat
                      ? "bg-blue-100 text-blue-700"
                      : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {fmt}
                </span>
              ))}
            </div>
            <button
              onClick={() => handleGenerate(report.id)}
              className="mt-4 w-full rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200"
            >
              Generar {selectedFormat}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
