import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTreatmentStore } from '@/stores/treatmentStore';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const treatmentSchema = z.object({
  medicamentoId: z.number({ required_error: 'Seleccione medicamento' }),
  dosis: z.string().min(1, 'Dosis es requerida'),
  frecuencia: z.string().min(1, 'Frecuencia es requerida'),
  fechaInicio: z.string().min(1, 'Fecha de inicio es requerida'),
  fechaFin: z.string().optional(),
  observaciones: z.string().max(2000, 'Máximo 2000 caracteres').optional(),
});

type TreatmentFormData = z.infer<typeof treatmentSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TreatmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  pacienteId: number;
  onSuccess: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TreatmentForm({
  isOpen,
  onClose,
  pacienteId,
  onSuccess,
}: TreatmentFormProps) {
  const medicamentos = useTreatmentStore((s) => s.medicamentos);
  const loadMedicamentos = useTreatmentStore((s) => s.loadMedicamentos);
  const createTreatment = useTreatmentStore((s) => s.createTreatment);
  const loading = useTreatmentStore((s) => s.loading);
  const error = useTreatmentStore((s) => s.error);
  const clearError = useTreatmentStore((s) => s.clearError);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<TreatmentFormData>({
    resolver: zodResolver(treatmentSchema),
    defaultValues: {
      medicamentoId: undefined,
      dosis: '',
      frecuencia: '',
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: '',
      observaciones: '',
    },
  });

  // Load medicamentos when modal opens
  useEffect(() => {
    if (isOpen) {
      loadMedicamentos();
      reset({
        medicamentoId: undefined,
        dosis: '',
        frecuencia: '',
        fechaInicio: new Date().toISOString().split('T')[0],
        fechaFin: '',
        observaciones: '',
      });
      clearError();
    }
  }, [isOpen, loadMedicamentos, reset, clearError]);

  const onSubmit = async (data: TreatmentFormData) => {
    try {
      await createTreatment({
        pacienteId,
        medicamentoId: data.medicamentoId,
        dosis: data.dosis,
        frecuencia: data.frecuencia,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin || undefined,
        observaciones: data.observaciones || undefined,
      });
      onSuccess();
      onClose();
    } catch {
      // error is set in the store
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900">
            Nuevo Tratamiento
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Medicamento dropdown */}
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Medicamento <span className="text-red-500">*</span>
            </label>
            <select
              {...register('medicamentoId', { valueAsNumber: true })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccione medicamento...</option>
              {medicamentos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
            {errors.medicamentoId && (
              <p className="mt-1 text-xs text-red-600">
                {errors.medicamentoId.message}
              </p>
            )}
          </div>

          {/* Dosis */}
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Dosis <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('dosis')}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 1 gotero al día"
            />
            {errors.dosis && (
              <p className="mt-1 text-xs text-red-600">
                {errors.dosis.message}
              </p>
            )}
          </div>

          {/* Frecuencia */}
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Frecuencia <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('frecuencia')}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Cada 24 horas"
            />
            {errors.frecuencia && (
              <p className="mt-1 text-xs text-red-600">
                {errors.frecuencia.message}
              </p>
            )}
          </div>

          {/* Fecha Inicio + Fecha Fin */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Fecha Inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('fechaInicio')}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.fechaInicio && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.fechaInicio.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Fecha Fin
              </label>
              <input
                type="date"
                {...register('fechaFin')}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Observaciones
            </label>
            <textarea
              {...register('observaciones')}
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notas adicionales..."
            />
            {errors.observaciones && (
              <p className="mt-1 text-xs text-red-600">
                {errors.observaciones.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || loading}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting || loading ? (
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Guardando...
                </span>
              ) : (
                'Guardar Tratamiento'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
