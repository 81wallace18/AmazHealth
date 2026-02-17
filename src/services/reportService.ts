import api from '@/lib/api';
import type { AttendanceReport, PharmacyReport, TriageReport } from '@/types/report';

export const reportService = {
  async getTriage(): Promise<TriageReport> {
    const response = await api.get<TriageReport>('/reports/triage');
    return response.data;
  },

  async getAttendance(): Promise<AttendanceReport> {
    const response = await api.get<AttendanceReport>('/reports/attendance');
    return response.data;
  },

  async getPharmacy(): Promise<PharmacyReport> {
    const response = await api.get<PharmacyReport>('/reports/pharmacy');
    return response.data;
  },
};
