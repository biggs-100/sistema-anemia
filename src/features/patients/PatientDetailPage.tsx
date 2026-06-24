import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePatientDetail } from "@/hooks/usePatients";
import { useControls } from "@/hooks/useControls";
import { useTreatments, useFinishTreatment, useSuspendTreatment } from "@/hooks/useTreatments";
import { ROUTES, SEXO_LABELS } from "@/utils/constants";
import ControlTable from "@/features/controls/components/ControlTable";
import HbEvolutionChart from "@/features/controls/components/HbEvolutionChart";
import ControlForm from "@/features/controls/components/ControlForm";
import TreatmentList from "@/features/treatments/components/TreatmentList";
import TreatmentForm from "@/features/treatments/components/TreatmentForm";
import Spinner from "@/components/ui/Spinner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabId = "datos" | "controles" | "tratamientos" | "visitas";

interface TabItem {
  id: TabId;
  label: string;
}

const tabs: TabItem[] = [
  { id: "datos", label: "Datos Generales" },
  { id: "controles", label: "Controles" },
  { id: "tratamientos", label: "Tratamientos" },
  { id: "visitas", label: "Visitas" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFecha(fecha: string): string {
  if (!fecha) return "—";
  try {
    const d = new Date(fecha);
    return d.toLocaleDateString("es-PE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return fecha;
  }
}

// ---------------------------------------------------------------------------
// InfoRow
// ---------------------------------------------------------------------------

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-neutral-900 sm:col-span-2 sm:mt-0">
        {value || "—"}
      </dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const patientId = id ? Number(id) : 0;
  const { patient, loading, error, loadPatient, clearError } = usePatientDetail(patientId);
  const [activeTab, setActiveTab] = useState<TabId>("datos");
  const [controlModalOpen, setControlModalOpen] = useState(false);
  const [treatmentModalOpen, setTreatmentModalOpen] = useState(false);

  // Load controls for the Controles tab
  const {
    controls,
    total,
    page,
    pageSize,
    loading: controlsLoading,
    setPage,
  } = useControls(activeTab === "controles" ? patientId : 0);

  // Load treatments for the Tratamientos tab
  const {
    treatments,
    loading: treatmentsLoading,
  } = useTreatments(activeTab === "tratamientos" ? patientId : 0);
  const { finishTreatment } = useFinishTreatment();
  const { suspendTreatment } = useSuspendTreatment();

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <div className="flex items-center gap-2 text-neutral-400">
          <Spinner size="md" />
          <span className="text-sm">Cargando paciente...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
          <div className="flex gap-2">
            <button
              onClick={() => patientId && loadPatient(patientId)}
              className="text-sm font-medium text-red-700 underline hover:text-red-800"
            >
              Reintentar
            </button>
            <button onClick={clearError} className="text-sm text-red-500 hover:text-red-700">
              ×
            </button>
          </div>
        </div>
        <button
          onClick={() => navigate(ROUTES.PATIENTS)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          &larr; Volver a Pacientes
        </button>
      </div>
    );
  }

  // Not found
  if (!patient) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-700">Paciente no encontrado</p>
        </div>
        <button
          onClick={() => navigate(ROUTES.PATIENTS)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          &larr; Volver a Pacientes
        </button>
      </div>
    );
  }

  const nombreCompleto = `${patient.apellidoPaterno} ${patient.apellidoMaterno}, ${patient.nombres}`;
  const sexoLabel = SEXO_LABELS[patient.sexo] || patient.sexo;

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate(ROUTES.PATIENTS)}
        className="text-sm text-blue-600 hover:text-blue-700"
      >
        &larr; Volver a Pacientes
      </button>

      {/* Patient info header card */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-neutral-900">{nombreCompleto}</h2>
            <p className="text-sm text-neutral-500">
              HC: {patient.historiaClinica} &nbsp;|&nbsp; DNI: {patient.dni}
            </p>
            <p className="text-sm text-neutral-500">
              Edad: {patient.edad} &nbsp;|&nbsp; Sexo: {sexoLabel}
            </p>
            {patient.nombreApoderado && (
              <p className="text-sm text-neutral-500">
                Apoderado: {patient.nombreApoderado}
                {patient.celularApoderado && ` — ${patient.celularApoderado}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                patient.activo
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {patient.activo ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>
      </div>

      {/* Edit & back buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate(ROUTES.PATIENT_EDIT.replace(":id", String(patient.id)))}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Editar Paciente
        </button>
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
            <h3 className="text-lg font-semibold text-neutral-900">Datos Generales</h3>
            <dl className="divide-y divide-neutral-200">
              <InfoRow label="Historia Clínica" value={patient.historiaClinica} />
              <InfoRow label="DNI" value={patient.dni} />
              <InfoRow label="Nombres" value={patient.nombres} />
              <InfoRow label="Apellido Paterno" value={patient.apellidoPaterno} />
              <InfoRow label="Apellido Materno" value={patient.apellidoMaterno} />
              <InfoRow label="Fecha de Nacimiento" value={formatFecha(patient.fechaNacimiento)} />
              <InfoRow label="Edad" value={patient.edad} />
              <InfoRow label="Sexo" value={sexoLabel} />
              <InfoRow
                label="Centro Poblado"
                value={patient.centroPobladoNombre ?? "—"}
              />
              <InfoRow label="Apoderado" value={patient.nombreApoderado ?? "—"} />
              <InfoRow label="Celular Apoderado" value={patient.celularApoderado ?? "—"} />
              <InfoRow label="Estado" value={patient.activo ? "Activo" : "Inactivo"} />
            </dl>
          </div>
        )}

        {activeTab === "controles" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900">Controles</h3>
              <button
                onClick={() => setControlModalOpen(true)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                + Nuevo Control
              </button>
            </div>

            {/* Control table */}
            <ControlTable
              controls={controls}
              total={total}
              page={page}
              pageSize={pageSize}
              loading={controlsLoading}
              onPageChange={setPage}
            />

            {/* Hb Evolution Chart */}
            <HbEvolutionChart controls={controls} />
          </div>
        )}

        {activeTab === "tratamientos" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900">Tratamientos</h3>
              <button
                onClick={() => setTreatmentModalOpen(true)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                + Nuevo Tratamiento
              </button>
            </div>

            {/* Treatment list */}
            <TreatmentList
              treatments={treatments}
              loading={treatmentsLoading}
              onFinish={(id) => finishTreatment(id)}
              onSuspend={(id) => suspendTreatment(id)}
            />
          </div>
        )}

        {activeTab === "visitas" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Visitas Domiciliarias</h3>
            <div className="rounded-lg border-2 border-dashed border-neutral-200 p-8 text-center">
              <p className="text-sm text-neutral-400">Registro de visitas — próximamente</p>
              <p className="mt-1 text-xs text-neutral-300">
                Esta sección mostrará las visitas domiciliarias del paciente
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Control Form Modal */}
      <ControlForm
        isOpen={controlModalOpen}
        onClose={() => setControlModalOpen(false)}
        pacienteId={patientId}
        onSuccess={() => {
          // Control was created — table will auto-refresh via useControls
        }}
      />

      {/* Treatment Form Modal */}
      <TreatmentForm
        isOpen={treatmentModalOpen}
        onClose={() => setTreatmentModalOpen(false)}
        pacienteId={patientId}
        onSuccess={() => {
          // Treatment was created — list will auto-refresh via useTreatments
        }}
      />
    </div>
  );
}
