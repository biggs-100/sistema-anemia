import { useCallback, useState } from "react";
import { usePatientStore } from "@/stores/patientStore";
import type { Patient, CreatePatientDTO } from "@/types/patient";

interface UsePatientsReturn {
  patients: Patient[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  search: (query: string) => Promise<void>;
  createPatient: (dto: CreatePatientDTO) => Promise<void>;
}

export function usePatients(): UsePatientsReturn {
  const [error, setError] = useState<string | null>(null);
  const { patients, loading, loadPatients, searchPatients, createPatient: storeCreate } = usePatientStore();

  const refresh = useCallback(async () => {
    setError(null);
    try {
      await loadPatients();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar pacientes");
    }
  }, [loadPatients]);

  const search = useCallback(
    async (query: string) => {
      setError(null);
      try {
        await searchPatients(query);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al buscar pacientes");
      }
    },
    [searchPatients],
  );

  const createPatient = useCallback(
    async (dto: CreatePatientDTO) => {
      setError(null);
      try {
        await storeCreate(dto);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al crear paciente");
        throw err;
      }
    },
    [storeCreate],
  );

  return { patients, loading, error, refresh, search, createPatient };
}
