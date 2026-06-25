import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAuthStore } from "@/stores/authStore";
import { API_COMMANDS } from "@/utils/constants";
import { patientService } from "@/services/patientService";
import type { Patient } from "@/types";
import Spinner from "@/components/ui/Spinner";

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
    formats: ["CSV"],
  },
  {
    id: "controls",
    title: "Controles por Mes",
    description: "Historial de controles de hemoglobina agrupados por mes",
    formats: ["CSV"],
  },
  {
    id: "anemia",
    title: "Casos de Anemia",
    description: "Reporte de pacientes clasificados por tipo de anemia",
    formats: ["PDF"],
  },
  {
    id: "treatments",
    title: "Tratamientos Activos",
    description: "Tratamientos actualmente activos en el sistema",
    formats: ["CSV"],
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

  // Controls-specific filters
  const [controlsMonth, setControlsMonth] = useState(new Date().toISOString().slice(0, 7));

  // Anemia (PDF) patient search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{ id: number; nombre: string } | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Patient search for PDF (debounced)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        if (!token) return;
        const result = await patientService.list(token, searchQuery, 1, 10);
        setSearchResults(result.data);
        setShowSearchResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, token]);

  // Close search results on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGenerate = async (reportId: string, format: string) => {
    if (!token) return;

    setGenerating(`${reportId}-${format}`);
    setMessage(null);

    try {
      if (format === "CSV") {
        const path = await invoke<string>(API_COMMANDS.GENERATE_CSV, {
          token,
          tipo: reportId,
        });
        setMessage(`Reporte CSV generado: ${path.split('/').pop() || path.split('\\').pop()}`);
        setMessageType("success");
      } else if (format === "PDF") {
        if (!selectedPatient) {
          setMessage("Seleccione un paciente para generar el PDF.");
          setMessageType("info");
          setGenerating(null);
          return;
        }
        const path = await invoke<string>(API_COMMANDS.GENERATE_PDF, {
          token,
          pacienteId: selectedPatient.id,
        });
        setMessage(`PDF generado: ${path.split('/').pop() || path.split('\\').pop()}`);
        setMessageType("success");
        setSelectedPatient(null);
        setSearchQuery("");
      } else if (format === "Excel") {
        setMessage(`Función Excel disponible próximamente. Use CSV para exportar datos.`);
        setMessageType("info");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al generar reporte";
      setMessage(msg);
      setMessageType("error");
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
          Genere reportes del sistema en PDF o CSV
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
        {/* Pacientes Registrados */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <h3 className="text-lg font-semibold text-neutral-900">Pacientes Registrados</h3>
          <p className="mt-1 text-sm text-neutral-500">Listado completo de pacientes con datos generales y estado</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => handleGenerate("patients", "CSV")}
              disabled={generating === "patients-CSV"}
              className="rounded-md bg-neutral-600 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating === "patients-CSV" ? (
                <span className="flex items-center gap-1"><Spinner size="sm" />...</span>
              ) : "CSV"}
            </button>
          </div>
        </div>

        {/* Controles por Mes */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <h3 className="text-lg font-semibold text-neutral-900">Controles por Mes</h3>
          <p className="mt-1 text-sm text-neutral-500">Historial de controles de hemoglobina agrupados por mes</p>
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-neutral-500 mb-1">Mes</label>
              <input
                type="month"
                value={controlsMonth}
                onChange={(e) => setControlsMonth(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => handleGenerate("controls", "CSV")}
              disabled={generating === "controls-CSV"}
              className="rounded-md bg-neutral-600 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating === "controls-CSV" ? (
                <span className="flex items-center gap-1"><Spinner size="sm" />...</span>
              ) : "CSV"}
            </button>
          </div>
        </div>

        {/* Casos de Anemia (PDF) */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <h3 className="text-lg font-semibold text-neutral-900">Casos de Anemia</h3>
          <p className="mt-1 text-sm text-neutral-500">Reporte PDF de un paciente con clasificación de anemia</p>
          <div className="mt-4 space-y-3">
            {/* Patient search */}
            <div ref={searchRef} className="relative">
              <label className="block text-xs font-medium text-neutral-500 mb-1">Buscar Paciente</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (selectedPatient) setSelectedPatient(null);
                }}
                placeholder="DNI, nombres o HC..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searching && (
                <div className="absolute right-3 top-9">
                  <Spinner size="sm" />
                </div>
              )}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 first:rounded-t-lg last:rounded-b-lg"
                      onClick={() => {
                        setSelectedPatient({ id: p.id, nombre: `${p.apellidoPaterno} ${p.apellidoMaterno}, ${p.nombres}` });
                        setSearchQuery(`${p.apellidoPaterno} ${p.apellidoMaterno}, ${p.nombres}`);
                        setShowSearchResults(false);
                      }}
                    >
                      <span className="font-medium">{p.apellidoPaterno} {p.apellidoMaterno}, {p.nombres}</span>
                      <span className="ml-2 text-xs text-neutral-400">HC: {p.historiaClinica}</span>
                    </button>
                  ))}
                </div>
              )}
              {showSearchResults && searchResults.length === 0 && searchQuery.length >= 2 && !searching && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-neutral-200 bg-white p-3 text-sm text-neutral-400 shadow-lg">
                  No se encontraron pacientes
                </div>
              )}
            </div>

            {selectedPatient && (
              <div className="flex items-center justify-between rounded-md bg-blue-50 px-3 py-2">
                <span className="text-sm text-blue-700">{selectedPatient.nombre}</span>
                <button
                  type="button"
                  onClick={() => { setSelectedPatient(null); setSearchQuery(""); }}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  ×
                </button>
              </div>
            )}

            <button
              onClick={() => handleGenerate("anemia", "PDF")}
              disabled={generating === "anemia-PDF" || !selectedPatient}
              className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating === "anemia-PDF" ? (
                <span className="flex items-center justify-center gap-1"><Spinner size="sm" />Generando...</span>
              ) : (
                "Generar PDF"
              )}
            </button>
          </div>
        </div>

        {/* Tratamientos Activos */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <h3 className="text-lg font-semibold text-neutral-900">Tratamientos Activos</h3>
          <p className="mt-1 text-sm text-neutral-500">Tratamientos actualmente activos en el sistema</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => handleGenerate("treatments", "CSV")}
              disabled={generating === "treatments-CSV"}
              className="rounded-md bg-neutral-600 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating === "treatments-CSV" ? (
                <span className="flex items-center gap-1"><Spinner size="sm" />...</span>
              ) : "CSV"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
