import { invoke } from "@tauri-apps/api/core";
import type { DashboardStats } from "@/types/dashboard";
import type { ApiResponse } from "@/types/api";

export const dashboardService = {
  async getStats(token: string): Promise<DashboardStats> {
    const res = await invoke<ApiResponse<DashboardStats>>(
      "get_dashboard_stats",
      { token },
    );
    if (!res.success) throw new Error(res.message);
    return res.data!;
  },
};
