import { useEffect, useCallback } from "react";
import { usePatientStore } from "@/stores/patientStore";
import type { Patient, CreatePatientDTO, UpdatePatientDTO, CentroPoblado } from "@/types";

// ---------------------------------------------------------------------------
// Hook for list page: search, pagination, centros poblados
// ---------------------------------------------------------------------------
export function usePatientList() {
  const patients = usePatientStore((s) => s.patients);
  const total = usePatientStore((s) => s.total);
  const page = usePatientStore((s) => s.page);
  const pageSize = usePatientStore((s) => s.pageSize);
  const searchQuery = usePatientStore((s) => s.searchQuery);
  const loading = usePatientStore((s) => s.loading);
  const error = usePatientStore((s) => s.error);
  const centrosPoblados = usePatientStore((s) => s.centrosPoblados);
  const loadPatients = usePatientStore((s) => s.loadPatients);
  const loadCentrosPoblados = usePatientStore((s) => s.loadCentrosPoblados);
  const setPage = usePatientStore((s) => s.setPage);
  const setSearchQuery = usePatientStore((s) => s.setSearchQuery);
  const clearError = usePatientStore((s) => s.clearError);
  const deactivatePatient = usePatientStore((s) => s.deactivatePatient);

  // Load centros poblados once on first mount
  useEffect(() => {
    loadCentrosPoblados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const search = useCallback(
    (query: string) => {
      setSearchQuery(query);
      loadPatients(query, 1);
    },
    [setSearchQuery, loadPatients],
  );

  const refresh = useCallback(() => {
    loadPatients(searchQuery, page);
  }, [loadPatients, searchQuery, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return {
    patients,
    total,
    page,
    pageSize,
    totalPages,
    from,
    to,
    searchQuery,
    loading,
    error,
    centrosPoblados,
    search,
    setPage,
    refresh,
    clearError,
    deactivatePatient,
  } as const;
}

// ---------------------------------------------------------------------------
// Hook for detail page: single patient fetch
// ---------------------------------------------------------------------------
export function usePatientDetail(id: number) {
  const selectedPatient = usePatientStore((s) => s.selectedPatient);
  const loadingDetail = usePatientStore((s) => s.loadingDetail);
  const error = usePatientStore((s) => s.error);
  const loadPatient = usePatientStore((s) => s.loadPatient);
  const clearError = usePatientStore((s) => s.clearError);

  useEffect(() => {
    if (id) {
      loadPatient(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return {
    patient: selectedPatient,
    loading: loadingDetail,
    error,
    loadPatient,
    clearError,
  } as const;
}

// ---------------------------------------------------------------------------
// Hook for patient search dropdown (used in standalone TreatmentsPage)
// ---------------------------------------------------------------------------
import { useState, useEffect, useRef } from "react";
import { patientService } from "@/services/patientService";
import { useAuthStore } from "@/stores/authStore";
import type { Patient } from "@/types";

export function usePatientSearch(query: string) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query || query.length < 2) {
      setPatients([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const token = useAuthStore.getState().token;
        if (!token) return;
        const result = await patientService.list(token, query, 1, 10);
        setPatients(result.data);
      } catch {
        setPatients([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return { patients, loading } as const;
}

// ---------------------------------------------------------------------------
// Hook for form page: create / update
// ---------------------------------------------------------------------------
export function usePatientForm() {
  const loading = usePatientStore((s) => s.loading);
  const error = usePatientStore((s) => s.error);
  const centrosPoblados = usePatientStore((s) => s.centrosPoblados);
  const createPatient = usePatientStore((s) => s.createPatient);
  const updatePatient = usePatientStore((s) => s.updatePatient);
  const loadCentrosPoblados = usePatientStore((s) => s.loadCentrosPoblados);
  const loadPatient = usePatientStore((s) => s.loadPatient);
  const clearError = usePatientStore((s) => s.clearError);

  // Load centros poblados on first mount
  useEffect(() => {
    loadCentrosPoblados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    loading,
    error,
    centrosPoblados,
    createPatient,
    updatePatient,
    loadPatient,
    clearError,
  } as const;
}
