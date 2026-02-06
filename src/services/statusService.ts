import api from "@/lib/api";

export interface BackendStatusInfo {
  service: string;
  timestamp: string;
  version?: string;
  gitSha?: string;
}

export const statusService = {
  async getStatus(): Promise<BackendStatusInfo> {
    const response = await api.get<BackendStatusInfo>("/status");
    return response.data;
  },
};

export default statusService;
