import api from "@/lib/api";
import type { DashboardSummary } from "@/types/dashboard";

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const response = await api.get<DashboardSummary>("/dashboard/summary");
    return response.data;
  }
};

export default dashboardService;
