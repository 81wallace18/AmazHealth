import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Appointment {
  id: string;
  appointment_code: string;
  patient_id: string;
  doctor_id: string;
  type: string;
  status: string;
  scheduled_date: string;
  duration_minutes: number;
  notes?: string;
  reason: string;
  created_at: string;
  updated_at: string;
  // Relations
  patient?: {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    phone?: string;
  };
  doctor?: {
    first_name: string;
    last_name: string;
    specialization?: string;
  };
}

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(first_name, last_name, date_of_birth, phone),
          doctor:staff(first_name, last_name, specialization)
        `)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Erro ao carregar agendamentos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addAppointment = async (appointmentData: Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'appointment_code' | 'patient' | 'doctor'>) => {
    try {
      // Generate appointment code
      const appointmentCode = `APT${Date.now()}`;
      
      const { data, error } = await supabase
        .from('appointments')
        .insert([{ ...appointmentData, appointment_code: appointmentCode }])
        .select(`
          *,
          patient:patients(first_name, last_name, date_of_birth, phone),
          doctor:staff(first_name, last_name, specialization)
        `)
        .single();

      if (error) throw error;

      setAppointments(prev => [data, ...prev]);
      toast({
        title: "Sucesso",
        description: "Agendamento criado com sucesso!",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error adding appointment:', error);
      toast({
        title: "Erro ao criar agendamento",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id)
        .select(`
          *,
          patient:patients(first_name, last_name, date_of_birth, phone),
          doctor:staff(first_name, last_name, specialization)
        `)
        .single();

      if (error) throw error;

      setAppointments(prev => prev.map(a => a.id === id ? data : a));
      toast({
        title: "Sucesso",
        description: "Status do agendamento atualizado!",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Erro ao atualizar agendamento",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  return {
    appointments,
    loading,
    addAppointment,
    updateAppointmentStatus,
    refetch: fetchAppointments,
  };
}