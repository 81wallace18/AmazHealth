import type { ManchesterColor } from "@/types/triage";

export interface ReceptionPatientListItem {
  patientId: string;
  patientName: string;
  patientCode: string;
  dateOfBirth: string;
  inAttendance: boolean;
}

export interface ReceptionQueueItem {
  patientName: string;
  patientCode: string;
  triageColor: ManchesterColor | null;
  areaName?: string | null;
  serviceName?: string | null;
  waitingTimeMinutes: number;
}
