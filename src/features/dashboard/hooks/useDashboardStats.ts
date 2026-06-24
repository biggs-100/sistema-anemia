import { useState, useEffect, useCallback } from "react";
import { dashboardService } from "@/services/dashboardService";
import { useAuthStore } from "@/stores/authStore";
import type { DashboardStats } from "@/types/dashboard";

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((s) => s.token);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getStats(token);
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar dashboard");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, loading, error, refresh: load };
}
