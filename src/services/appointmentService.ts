import api from '@/lib/api';
import type { Appointment, AppointmentRequest, AppointmentStatus, AppointmentStatusUpdateRequest } from '@/types/appointment';

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const appointmentService = {
  async findAll(params?: { status?: AppointmentStatus; page?: number; size?: number }): Promise<PageResponse<Appointment>> {
    const response = await api.get<PageResponse<Appointment>>('/appointments', {
      params: {
        status: params?.status,
        page: params?.page ?? 0,
        size: params?.size ?? 20,
      },
    });
    return response.data;
  },

  async findById(id: string): Promise<Appointment> {
    const response = await api.get<Appointment>(`/appointments/${id}`);
    return response.data;
  },

  async create(data: AppointmentRequest): Promise<Appointment> {
    const response = await api.post<Appointment>('/appointments', data);
    return response.data;
  },

  async updateStatus(id: string, request: AppointmentStatusUpdateRequest): Promise<Appointment> {
    const response = await api.patch<Appointment>(`/appointments/${id}/status`, request);
    return response.data;
  },
};
