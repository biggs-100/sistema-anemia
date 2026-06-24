import { useCallback, useState } from "react";
import type { Control, CreateControlDTO } from "@/types/control";
// import { controlService } from "@/services/controlService";

interface UseControlsReturn {
  controls: Control[];
  loading: boolean;
  error: string | null;
  fetchControls: (pacienteId: number) => Promise<void>;
  addControl: (dto: CreateControlDTO) => Promise<void>;
}

export function useControls(): UseControlsReturn {
  const [controls, setControls] = useState<Control[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchControls = useCallback(async (pacienteId: number) => {
    setLoading(true);
    setError(null);
    try {
      // const data = await controlService.getControls(pacienteId);
      // setControls(data);
      setControls([]);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al obtener controles");
      setLoading(false);
    }
  }, []);

  const addControl = useCallback(async (_dto: CreateControlDTO) => {
    setLoading(true);
    setError(null);
    try {
      // const newControl = await controlService.createControl(dto);
      // setControls((prev) => [newControl, ...prev]);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear control");
      setLoading(false);
      throw err;
    }
  }, []);

  return { controls, loading, error, fetchControls, addControl };
}
