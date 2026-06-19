import { useCallback, useEffect, useState } from 'react';
import { appointmentService } from '@/services/appointmentService';
import type { Appointment, AppointmentRequest, AppointmentStatus } from '@/types/appointment';

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (status?: AppointmentStatus) => {
    try {
      setLoading(true);
      const page = await appointmentService.findAll({ status, page: 0, size: 50 });
      setAppointments(page.content ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createAppointment = async (request: AppointmentRequest) => {
    await appointmentService.create(request);
    await load();
  };

  const updateStatus = async (id: string, status: AppointmentStatus) => {
    await appointmentService.updateStatus(id, { status });
    await load();
  };

  return {
    appointments,
    loading,
    createAppointment,
    updateStatus,
    refetch: load,
  };
}
