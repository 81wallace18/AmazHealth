export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Appointment {
  id: string;
  organizationId: string;
  appointmentCode: string;
  patientId: string;
  patientName?: string | null;
  doctorId: string;
  doctorName?: string | null;
  type: string;
  status: AppointmentStatus;
  scheduledDate: string;
  durationMinutes?: number | null;
  reason: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentRequest {
  patientId: string;
  doctorId: string;
  type: string;
  scheduledDate: string;
  durationMinutes?: number | null;
  reason: string;
  notes?: string | null;
}

export interface AppointmentStatusUpdateRequest {
  status: AppointmentStatus;
}
