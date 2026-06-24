import { useEffect } from 'react';
import { useTreatmentStore } from '@/stores/treatmentStore';

// ---------------------------------------------------------------------------
// Hook for listing treatments by patient
// ---------------------------------------------------------------------------
export function useTreatments(pacienteId: number) {
  const treatments = useTreatmentStore((s) => s.treatments);
  const loading = useTreatmentStore((s) => s.loading);
  const error = useTreatmentStore((s) => s.error);
  const loadTreatments = useTreatmentStore((s) => s.loadTreatments);
  const loadMedicamentos = useTreatmentStore((s) => s.loadMedicamentos);
  const clearError = useTreatmentStore((s) => s.clearError);

  useEffect(() => {
    if (pacienteId) {
      loadTreatments(pacienteId);
    }
    // Load medicamentos once (they're cached in the store)
    loadMedicamentos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteId]);

  return {
    treatments,
    loading,
    error,
    loadTreatments: () => loadTreatments(pacienteId),
    clearError,
  } as const;
}

// ---------------------------------------------------------------------------
// Hook for creating a treatment
// ---------------------------------------------------------------------------
export function useCreateTreatment() {
  const loading = useTreatmentStore((s) => s.loading);
  const error = useTreatmentStore((s) => s.error);
  const createTreatment = useTreatmentStore((s) => s.createTreatment);
  const clearError = useTreatmentStore((s) => s.clearError);

  return {
    createTreatment,
    loading,
    error,
    clearError,
  } as const;
}

// ---------------------------------------------------------------------------
// Hook for finishing a treatment
// ---------------------------------------------------------------------------
export function useFinishTreatment() {
  const loading = useTreatmentStore((s) => s.loading);
  const error = useTreatmentStore((s) => s.error);
  const finishTreatment = useTreatmentStore((s) => s.finishTreatment);
  const clearError = useTreatmentStore((s) => s.clearError);

  return {
    finishTreatment,
    loading,
    error,
    clearError,
  } as const;
}

// ---------------------------------------------------------------------------
// Hook for suspending a treatment
// ---------------------------------------------------------------------------
export function useSuspendTreatment() {
  const loading = useTreatmentStore((s) => s.loading);
  const error = useTreatmentStore((s) => s.error);
  const suspendTreatment = useTreatmentStore((s) => s.suspendTreatment);
  const clearError = useTreatmentStore((s) => s.clearError);

  return {
    suspendTreatment,
    loading,
    error,
    clearError,
  } as const;
}
