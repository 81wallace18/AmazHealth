import api from "@/lib/api";
import type { DashboardSummary } from "@/types/dashboard";

export interface DailyCount {
  date: string;
  count: number;
}

export interface TopComplaint {
  complaint: string;
  count: number;
}

export interface GestoraDashboard {
  dailyCounts: DailyCount[];
  topComplaints: TopComplaint[];
  triageColorCounts: Record<string, number>;
  outcomeCounts: Record<string, number>;
  totalPeriod: number;
  ongoingNow: number;
  generatedAt: string;
}

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const response = await api.get<DashboardSummary>("/dashboard/summary");
    return response.data;
  },

  async getGestora(startDate?: string, endDate?: string): Promise<GestoraDashboard> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get<GestoraDashboard>("/dashboard/gestora", { params });
    return response.data;
  },
};

export default dashboardService;
