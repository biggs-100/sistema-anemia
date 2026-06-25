import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { usePatientDetail } from "@/hooks/usePatients";
import { useControls } from "@/hooks/useControls";
import { useTreatments, useFinishTreatment, useSuspendTreatment } from "@/hooks/useTreatments";
import { useAuthStore } from "@/stores/authStore";
import { useVisitaStore } from "@/stores/visitaStore";
import { ROUTES, SEXO_LABELS, API_COMMANDS } from "@/utils/constants";
import ControlTable from "@/features/controls/components/ControlTable";
import HbEvolutionChart from "@/features/controls/components/HbEvolutionChart";
import ControlForm from "@/features/controls/components/ControlForm";
import TreatmentList from "@/features/treatments/components/TreatmentList";
import TreatmentForm from "@/features/treatments/components/TreatmentForm";
import Modal from "@/components/ui/Modal";
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
  const [visitaModalOpen, setVisitaModalOpen] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [pdfMessage, setPdfMessage] = useState<string | null>(null);

  // Visitas store
  const {
    visitas,
    loading: visitasLoading,
    loadVisitas,
    createVisita,
    clearVisitas,
  } = useVisitaStore();

  // Load visitas when tab is active
  useEffect(() => {
    if (activeTab === "visitas" && patientId) {
      loadVisitas(patientId);
    }
    return () => {
      if (activeTab !== "visitas") {
        clearVisitas();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, patientId]);

  const token = useAuthStore((s) => s.token);

  const handleDownloadPDF = async () => {
    if (!token || !patient) return;
    setLoadingPDF(true);
    setPdfMessage(null);
    try {
      const path = await invoke<string>(API_COMMANDS.GENERATE_PDF, { token, pacienteId: patient.id });
      setPdfMessage(`PDF generado: ${path.split("\\").pop() || path.split("/").pop()}`);
    } catch (e) {
      setPdfMessage("Error al generar PDF");
    } finally {
      setLoadingPDF(false);
    }
  };

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

      {/* PDF download message */}
      {pdfMessage && (
        <div className={`rounded-lg border p-4 ${
          pdfMessage.includes("Error") ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50"
        }`}>
          <div className="flex items-center justify-between">
            <p className={`text-sm ${
              pdfMessage.includes("Error") ? "text-red-700" : "text-blue-700"
            }`}>{pdfMessage}</p>
            <button onClick={() => setPdfMessage(null)} className="text-sm opacity-60 hover:opacity-100">&times;</button>
          </div>
        </div>
      )}

      {/* Edit, PDF & back buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate(ROUTES.PATIENT_EDIT.replace(":id", String(patient.id)))}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Editar Paciente
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={loadingPDF}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingPDF ? (
            <span className="flex items-center gap-1">
              <Spinner size="sm" />
              ...
            </span>
          ) : (
            "Descargar PDF"
          )}
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
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900">Visitas Domiciliarias</h3>
              <button
                onClick={() => setVisitaModalOpen(true)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                + Nueva Visita
              </button>
            </div>

            {visitasLoading ? (
              <div className="flex items-center justify-center py-8 text-neutral-400">
                <Spinner size="md" />
                <span className="ml-2 text-sm">Cargando visitas...</span>
              </div>
            ) : visitas.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-neutral-200 p-8 text-center">
                <p className="text-sm text-neutral-400">No hay visitas registradas</p>
                <p className="mt-1 text-xs text-neutral-300">
                  Registre una nueva visita domiciliaria para este paciente
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-neutral-200">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Responsable</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Resultado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {visitas.map((visita) => (
                      <tr key={visita.id} className="hover:bg-neutral-50">
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-600">
                          {formatFecha(visita.fechaVisita)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-900">
                          {visita.responsable || "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            visita.resultado === "Encontrado" ? "bg-green-100 text-green-800" :
                            visita.resultado === "Ausente" ? "bg-red-100 text-red-800" :
                            visita.resultado === "Reagendado" ? "bg-amber-100 text-amber-800" :
                            "bg-neutral-100 text-neutral-600"
                          }`}>
                            {visita.resultado || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-600 max-w-xs truncate">
                          {visita.observaciones || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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

      {/* Visita Form Modal */}
      <VisitaFormModal
        isOpen={visitaModalOpen}
        onClose={() => setVisitaModalOpen(false)}
        pacienteId={patientId}
        onCreateVisita={createVisita}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// VisitaFormModal
// ---------------------------------------------------------------------------

interface VisitaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  pacienteId: number;
  onCreateVisita: (dto: { pacienteId: number; fechaVisita: string; responsable?: string; resultado?: string; observaciones?: string }) => Promise<unknown>;
}

function VisitaFormModal({ isOpen, onClose, pacienteId, onCreateVisita }: VisitaFormModalProps) {
  const [fechaVisita, setFechaVisita] = useState(new Date().toISOString().split("T")[0]);
  const [responsable, setResponsable] = useState("");
  const [resultado, setResultado] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setFechaVisita(new Date().toISOString().split("T")[0]);
      setResponsable("");
      setResultado("");
      setObservaciones("");
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaVisita) {
      setError("La fecha es requerida");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onCreateVisita({
        pacienteId,
        fechaVisita,
        responsable: responsable.trim() || undefined,
        resultado: resultado || undefined,
        observaciones: observaciones.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear visita");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Visita Domiciliaria">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Fecha */}
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Fecha de Visita <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={fechaVisita}
            onChange={(e) => setFechaVisita(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Responsable */}
        <div>
          <label className="block text-sm font-medium text-neutral-700">Responsable</label>
          <input
            type="text"
            value={responsable}
            onChange={(e) => setResponsable(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nombre del responsable"
          />
        </div>

        {/* Resultado dropdown */}
        <div>
          <label className="block text-sm font-medium text-neutral-700">Resultado</label>
          <select
            value={resultado}
            onChange={(e) => setResultado(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccione...</option>
            <option value="Encontrado">Encontrado</option>
            <option value="Ausente">Ausente</option>
            <option value="Reagendado">Reagendado</option>
          </select>
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-medium text-neutral-700">Observaciones</label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Notas adicionales..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <span className="flex items-center gap-1">
                <Spinner size="sm" />
                Guardando...
              </span>
            ) : (
              "Guardar Visita"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
