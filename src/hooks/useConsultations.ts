import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Consultation {
  id: string;
  patient_id: string;
  doctor_id: string;
  visit_date: string;
  chief_complaint: string;
  symptoms?: string;
  diagnosis?: string;
  treatment_plan?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  visit_type: 'consultation' | 'follow_up' | 'emergency';
  visit_code: string;
  follow_up_date?: string;
  created_at: string;
  updated_at: string;
  
  // Related data
  patients?: {
    id: string;
    first_name: string;
    last_name: string;
    patient_code: string;
  };
  staff?: {
    id: string;
    first_name: string;
    last_name: string;
    specialization: string;
  };
}

export function useConsultations() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('opd_visits')
        .select(`
          *,
          patients!opd_visits_patient_id_fkey (
            id,
            first_name,
            last_name,
            patient_code
          ),
          staff!opd_visits_doctor_id_fkey (
            id,
            first_name,
            last_name,
            specialization
          )
        `)
        .order('visit_date', { ascending: false });

      if (error) throw error;
      setConsultations((data || []) as unknown as Consultation[]);
    } catch (error: any) {
      console.error('Error fetching consultations:', error);
      toast({
        title: "Erro ao carregar consultas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateConsultationStatus = async (id: string, status: Consultation['status']) => {
    try {
      const { data, error } = await supabase
        .from('opd_visits')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setConsultations(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      toast({
        title: "Sucesso",
        description: "Status da consulta atualizado com sucesso!",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error updating consultation status:', error);
      toast({
        title: "Erro ao atualizar consulta",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateConsultation = async (id: string, updates: Partial<Consultation>) => {
    try {
      const { data, error } = await supabase
        .from('opd_visits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setConsultations(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      toast({
        title: "Sucesso",
        description: "Consulta atualizada com sucesso!",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error updating consultation:', error);
      toast({
        title: "Erro ao atualizar consulta",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  return {
    consultations,
    loading,
    updateConsultationStatus,
    updateConsultation,
    refetch: fetchConsultations,
  };
}