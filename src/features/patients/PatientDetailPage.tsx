import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ROUTES } from "@/utils/constants";

type TabId = "datos" | "controles" | "tratamientos" | "visitas";

interface Tab {
  id: TabId;
  label: string;
}

const tabs: Tab[] = [
  { id: "datos", label: "Datos Generales" },
  { id: "controles", label: "Controles" },
  { id: "tratamientos", label: "Tratamientos" },
  { id: "visitas", label: "Visitas" },
];

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabId>("datos");

  // Tauri invoke("get_patient", { id: Number(id) }) will load patient data
  // Also: get_controls, get_treatments, get_visitas per tab

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to={ROUTES.PATIENTS}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            &larr; Volver a Pacientes
          </Link>
          <h2 className="mt-1 text-2xl font-bold text-neutral-900">
            Detalle del Paciente
          </h2>
          <p className="text-sm text-neutral-500">
            ID: {id} — Historia Clínica: {/* patient?.historiaClinica */}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        {activeTab === "datos" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">
              Datos Generales
            </h3>
            {/* Patient info fields — populated via Tauri invoke */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase text-neutral-500">DNI</p>
                <p className="mt-1 text-sm text-neutral-900">—</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-neutral-500">Nombres</p>
                <p className="mt-1 text-sm text-neutral-900">—</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-neutral-500">
                  Apellido Paterno
                </p>
                <p className="mt-1 text-sm text-neutral-900">—</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-neutral-500">
                  Apellido Materno
                </p>
                <p className="mt-1 text-sm text-neutral-900">—</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-neutral-500">
                  Fecha Nacimiento
                </p>
                <p className="mt-1 text-sm text-neutral-900">—</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-neutral-500">Sexo</p>
                <p className="mt-1 text-sm text-neutral-900">—</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "controles" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900">Controles</h3>
              {/* Nuevo Control button */}
            </div>
            <p className="text-sm text-neutral-400">
              Historial de controles — próximamente
            </p>
            {/* Control list rendered here via Tauri invoke("get_controls") */}
          </div>
        )}

        {activeTab === "tratamientos" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">
              Tratamientos
            </h3>
            <p className="text-sm text-neutral-400">
              Historial de tratamientos — próximamente
            </p>
            {/* Treatment list via Tauri invoke("get_treatments") */}
          </div>
        )}

        {activeTab === "visitas" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">
              Visitas Domiciliarias
            </h3>
            <p className="text-sm text-neutral-400">
              Registro de visitas — próximamente
            </p>
            {/* Visitas list via Tauri invoke */}
          </div>
        )}
      </div>
    </div>
  );
}
