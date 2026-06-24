import type { Treatment } from '@/types';
import TreatmentBadge from './TreatmentBadge';
import { formatDate } from '@/utils/format';
import Spinner from '@/components/ui/Spinner';

interface TreatmentListProps {
  treatments: Treatment[];
  loading: boolean;
  onFinish?: (id: number) => void;
  onSuspend?: (id: number) => void;
}

export default function TreatmentList({
  treatments,
  loading,
  onFinish,
  onSuspend,
}: TreatmentListProps) {
  const handleSuspend = (id: number) => {
    if (window.confirm('¿Está seguro de suspender este tratamiento?')) {
      onSuspend?.(id);
    }
  };

  const handleFinish = (id: number) => {
    if (window.confirm('¿Está seguro de finalizar este tratamiento?')) {
      onFinish?.(id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-neutral-400">
          <Spinner size="md" />
          <span className="text-sm">Cargando tratamientos...</span>
        </div>
      </div>
    );
  }

  if (treatments.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-neutral-200 p-8 text-center">
        <p className="text-sm text-neutral-400">No hay tratamientos registrados</p>
        <p className="mt-1 text-xs text-neutral-300">
          Use el botón "Nuevo Tratamiento" para agregar uno
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
              Medicamento
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
              Dosis
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
              Frecuencia
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
              Inicio
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
              Fin
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
              Estado
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {treatments.map((t) => (
            <tr key={t.id} className="hover:bg-neutral-50">
              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-neutral-900">
                {t.medicamentoNombre}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-600">
                {t.dosis}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-600">
                {t.frecuencia}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-600">
                {formatDate(t.fechaInicio)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-600">
                {t.fechaFin ? formatDate(t.fechaFin) : '—'}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <TreatmentBadge estado={t.estado} />
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                {t.estado === 'activo' && (
                  <div className="flex gap-2">
                    {onFinish && (
                      <button
                        onClick={() => handleFinish(t.id)}
                        className="rounded bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                      >
                        Finalizar
                      </button>
                    )}
                    {onSuspend && (
                      <button
                        onClick={() => handleSuspend(t.id)}
                        className="rounded bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                      >
                        Suspender
                      </button>
                    )}
                  </div>
                )}
                {t.estado !== 'activo' && (
                  <span className="text-xs text-neutral-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
