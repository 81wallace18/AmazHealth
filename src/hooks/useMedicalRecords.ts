import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  visit_id?: string;
  record_date: string;
  record_type: string;
  chief_complaint?: string;
  history_of_present_illness?: string;
  physical_examination?: string;
  diagnosis?: string;
  treatment?: string;
  medications?: string;
  notes?: string;
  vital_signs?: any;
  attachments?: string[];
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

export interface CreateMedicalRecordData {
  patient_id: string;
  doctor_id: string;
  visit_id?: string;
  record_type: 'consultation' | 'examination' | 'procedure' | 'surgery' | 'discharge';
  chief_complaint?: string;
  history_of_present_illness?: string;
  physical_examination?: string;
  diagnosis?: string;
  treatment?: string;
  medications?: string;
  notes?: string;
  vital_signs?: any;
  attachments?: string[];
}

export const useMedicalRecords = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('medical_records')
        .select(`
          *,
          patient:patients(first_name, last_name, patient_code),
          doctor:staff(first_name, last_name, staff_code)
        `)
        .order('record_date', { ascending: false });

      if (error) {
        throw error;
      }

      setRecords(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch medical records';
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

  const createRecord = async (recordData: CreateMedicalRecordData) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('medical_records')
        .insert([recordData])
        .select(`
          *,
          patient:patients(first_name, last_name, patient_code),
          doctor:staff(first_name, last_name, staff_code)
        `)
        .single();

      if (error) {
        throw error;
      }

      setRecords(prev => [data, ...prev]);
      
      toast({
        title: "Success",
        description: "Medical record created successfully",
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create medical record';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  return {
    records,
    loading,
    error,
    fetchRecords,
    createRecord,
  };
};