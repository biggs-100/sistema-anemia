import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTreatments, useFinishTreatment, useSuspendTreatment } from '@/hooks/useTreatments';
import { usePatientSearch } from '@/hooks/usePatients';
import { ROUTES } from '@/utils/constants';
import TreatmentList from '@/features/treatments/components/TreatmentList';
import TreatmentForm from '@/features/treatments/components/TreatmentForm';

export default function TreatmentsPage() {
  const navigate = useNavigate();
  const [selectedPacienteId, setSelectedPacienteId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [treatmentFormOpen, setTreatmentFormOpen] = useState(false);

  const { patients, loading: searchLoading } = usePatientSearch(searchQuery);
  const { treatments, loading: treatmentsLoading } = useTreatments(selectedPacienteId ?? 0);
  const { finishTreatment } = useFinishTreatment();
  const { suspendTreatment } = useSuspendTreatment();

  const handlePatientSelect = useCallback((id: number) => {
    setSelectedPacienteId(id);
    setSearchQuery('');
  }, []);

  const selectedPatientName = selectedPacienteId
    ? patients.find((p) => p.id === selectedPacienteId)?.nombres ?? ''
    : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Tratamientos</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Gestión de tratamientos con hierro
          </p>
        </div>
        {selectedPacienteId && (
          <button
            onClick={() => setTreatmentFormOpen(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Nuevo Tratamiento
          </button>
        )}
      </div>

      {/* Patient Search / Selector */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Seleccionar Paciente
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, DNI o historia clínica..."
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {searchQuery && (
            <div className="absolute z-10 mt-1 w-full rounded-md border border-neutral-200 bg-white shadow-lg">
              {searchLoading ? (
                <div className="px-3 py-4 text-center text-sm text-neutral-400">
                  Buscando...
                </div>
              ) : patients.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-neutral-400">
                  No se encontraron pacientes
                </div>
              ) : (
                <ul className="max-h-60 overflow-auto py-1">
                  {patients.map((p) => (
                    <li key={p.id}>
                      <button
                        onClick={() => handlePatientSelect(p.id)}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 ${
                          selectedPacienteId === p.id
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-neutral-700'
                        }`}
                      >
                        <span className="font-medium">
                          {p.apellidoPaterno} {p.apellidoMaterno}, {p.nombres}
                        </span>
                        <span className="ml-2 text-neutral-400">
                          HC: {p.historiaClinica} | DNI: {p.dni}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        {selectedPacienteId && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-neutral-500">Paciente seleccionado:</span>
            <span className="text-sm font-medium text-neutral-900">
              {patients.find((p) => p.id === selectedPacienteId)
                ? `${selectedPatientName} ${patients.find((p) => p.id === selectedPacienteId)?.apellidoPaterno}`
                : `ID: ${selectedPacienteId}`}
            </span>
            <button
              onClick={() => {
                setSelectedPacienteId(null);
              }}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Cambiar
            </button>
          </div>
        )}
      </div>

      {/* Treatment list */}
      {selectedPacienteId ? (
        <TreatmentList
          treatments={treatments}
          loading={treatmentsLoading}
          onFinish={(id) => finishTreatment(id)}
          onSuspend={(id) => suspendTreatment(id)}
        />
      ) : (
        <div className="rounded-lg border-2 border-dashed border-neutral-200 p-12 text-center">
          <p className="text-sm text-neutral-400">
            Seleccione un paciente para ver sus tratamientos
          </p>
        </div>
      )}

      {/* Treatment Form Modal */}
      {selectedPacienteId && (
        <TreatmentForm
          isOpen={treatmentFormOpen}
          onClose={() => setTreatmentFormOpen(false)}
          pacienteId={selectedPacienteId}
          onSuccess={() => {
            // List auto-refreshes via useTreatments
          }}
        />
      )}
    </div>
  );
}
