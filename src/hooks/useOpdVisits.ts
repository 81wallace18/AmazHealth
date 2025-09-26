import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OpdVisit {
  id: string;
  patient_id: string;
  doctor_id: string;
  visit_date: string;
  visit_code: string;
  chief_complaint: string;
  symptoms?: string;
  diagnosis?: string;
  treatment_plan?: string;
  follow_up_date?: string;
  status: string;
  visit_type: string;
  created_at: string;
  updated_at: string;
  patient?: {
    first_name: string;
    last_name: string;
    patient_code: string;
  };
  doctor?: {
    first_name: string;
    last_name: string;
    staff_code: string;
  };
}

export interface CreateOpdVisitData {
  patient_id: string;
  doctor_id: string;
  visit_code: string;
  chief_complaint: string;
  symptoms?: string;
  diagnosis?: string;
  treatment_plan?: string;
  follow_up_date?: string;
  visit_type?: 'consultation' | 'follow_up' | 'emergency' | 'routine';
}

export const useOpdVisits = () => {
  const [visits, setVisits] = useState<OpdVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchVisits = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('opd_visits')
        .select(`
          *,
          patient:patients(first_name, last_name, patient_code),
          doctor:staff(first_name, last_name, staff_code)
        `)
        .order('visit_date', { ascending: false });

      if (error) {
        throw error;
      }

      setVisits(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch OPD visits';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createVisit = async (visitData: CreateOpdVisitData) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('opd_visits')
        .insert([visitData])
        .select(`
          *,
          patient:patients(first_name, last_name, patient_code),
          doctor:staff(first_name, last_name, staff_code)
        `)
        .single();

      if (error) {
        throw error;
      }

      setVisits(prev => [data, ...prev]);
      
      toast({
        title: "Success",
        description: "OPD visit created successfully",
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create OPD visit';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateVisit = async (id: string, updates: Partial<CreateOpdVisitData>) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('opd_visits')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          patient:patients(first_name, last_name, patient_code),
          doctor:staff(first_name, last_name, staff_code)
        `)
        .single();

      if (error) {
        throw error;
      }

      setVisits(prev => prev.map(visit => visit.id === id ? data : visit));
      
      toast({
        title: "Success",
        description: "OPD visit updated successfully",
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update OPD visit';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateVisitStatus = async (id: string, status: OpdVisit['status']) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('opd_visits')
        .update({ status })
        .eq('id', id)
        .select(`
          *,
          patient:patients(first_name, last_name, patient_code),
          doctor:staff(first_name, last_name, staff_code)
        `)
        .single();

      if (error) {
        throw error;
      }

      setVisits(prev => prev.map(visit => visit.id === id ? data : visit));
      
      toast({
        title: "Success",
        description: "Visit status updated successfully",
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update visit status';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteVisit = async (id: string) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('opd_visits')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setVisits(prev => prev.filter(visit => visit.id !== id));
      
      toast({
        title: "Success",
        description: "OPD visit deleted successfully",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete OPD visit';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const getVisitsByPatient = async (patientId: string) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('opd_visits')
        .select(`
          *,
          patient:patients(first_name, last_name, patient_code),
          doctor:staff(first_name, last_name, staff_code)
        `)
        .eq('patient_id', patientId)
        .order('visit_date', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch patient visits';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return [];
    }
  };

  const getVisitsByDoctor = async (doctorId: string) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('opd_visits')
        .select(`
          *,
          patient:patients(first_name, last_name, patient_code),
          doctor:staff(first_name, last_name, staff_code)
        `)
        .eq('doctor_id', doctorId)
        .order('visit_date', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch doctor visits';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return [];
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  return {
    visits,
    loading,
    error,
    fetchVisits,
    createVisit,
    updateVisit,
    updateVisitStatus,
    deleteVisit,
    getVisitsByPatient,
    getVisitsByDoctor,
  };
};