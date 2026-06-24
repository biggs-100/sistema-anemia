import { useEffect, useCallback } from "react";
import { useControlStore } from "@/stores/controlStore";
import type { CreateControlDTO } from "@/types";

// ---------------------------------------------------------------------------
// Hook for listing controls by patient with pagination
// ---------------------------------------------------------------------------
export function useControls(pacienteId: number) {
  const controls = useControlStore((s) => s.controls);
  const total = useControlStore((s) => s.total);
  const page = useControlStore((s) => s.page);
  const pageSize = useControlStore((s) => s.pageSize);
  const loading = useControlStore((s) => s.loading);
  const error = useControlStore((s) => s.error);
  const loadControls = useControlStore((s) => s.loadControls);
  const setPage = useControlStore((s) => s.setPage);
  const clearError = useControlStore((s) => s.clearError);

  // Auto-load controls when pacienteId changes
  useEffect(() => {
    if (pacienteId) {
      loadControls(pacienteId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteId]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const refresh = useCallback(() => {
    loadControls(pacienteId, page);
  }, [loadControls, pacienteId, page]);

  return {
    controls,
    total,
    page,
    pageSize,
    totalPages,
    from,
    to,
    loading,
    error,
    loadControls: refresh,
    setPage,
    clearError,
  } as const;
}

// ---------------------------------------------------------------------------
// Hook for creating a control
// ---------------------------------------------------------------------------
export function useCreateControl() {
  const loading = useControlStore((s) => s.loading);
  const error = useControlStore((s) => s.error);
  const createControl = useControlStore((s) => s.createControl);
  const clearError = useControlStore((s) => s.clearError);

  return {
    createControl,
    loading,
    error,
    clearError,
  } as const;
}
