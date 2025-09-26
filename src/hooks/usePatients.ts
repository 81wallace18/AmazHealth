import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  blood_type?: string;
  allergies?: string;
  medical_history?: string;
  patient_code: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Erro ao carregar pacientes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addPatient = async (patientData: Omit<Patient, 'id' | 'created_at' | 'updated_at' | 'patient_code'>) => {
    try {
      // Generate patient code
      const patientCode = `PAT${Date.now()}`;
      
      const { data, error } = await supabase
        .from('patients')
        .insert([{ ...patientData, patient_code: patientCode }])
        .select()
        .single();

      if (error) throw error;

      setPatients(prev => [data, ...prev]);
      toast({
        title: "Sucesso",
        description: "Paciente cadastrado com sucesso!",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error adding patient:', error);
      toast({
        title: "Erro ao cadastrar paciente",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePatient = async (id: string, updates: Partial<Patient>) => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setPatients(prev => prev.map(p => p.id === id ? data : p));
      toast({
        title: "Sucesso",
        description: "Paciente atualizado com sucesso!",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error updating patient:', error);
      toast({
        title: "Erro ao atualizar paciente",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deletePatient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPatients(prev => prev.filter(p => p.id !== id));
      toast({
        title: "Sucesso",
        description: "Paciente removido com sucesso!",
      });
    } catch (error: any) {
      console.error('Error deleting patient:', error);
      toast({
        title: "Erro ao remover paciente",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  return {
    patients,
    loading,
    addPatient,
    updatePatient,
    deletePatient,
    refetch: fetchPatients,
  };
}