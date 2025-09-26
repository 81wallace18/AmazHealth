import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Medicine {
  id: string;
  medicine_code: string;
  medicine_name: string;
  generic_name?: string;
  strength?: string;
  dosage_form: string;
  manufacturer?: string;
  category: string;
  unit_price: number;
  reorder_level: number;
  is_active: boolean;
  description?: string;
  side_effects?: string;
  contraindications?: string;
  created_at: string;
  updated_at: string;
}

export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  visit_id?: string;
  prescription_code: string;
  prescription_date: string;
  status: string;
  notes?: string;
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

export interface CreateMedicineData {
  medicine_code: string;
  medicine_name: string;
  generic_name?: string;
  strength?: string;
  dosage_form: 'tablet' | 'capsule' | 'syrup' | 'injection' | 'cream' | 'drops' | 'other';
  manufacturer?: string;
  category: string;
  unit_price: number;
  reorder_level?: number;
  description?: string;
  side_effects?: string;
  contraindications?: string;
}

export interface CreatePrescriptionData {
  patient_id: string;
  doctor_id: string;
  visit_id?: string;
  prescription_code: string;
  notes?: string;
}

export const usePharmacy = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMedicines = async () => {
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .eq('is_active', true)
        .order('medicine_name');

      if (error) throw error;
      setMedicines(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch medicines';
      setError(errorMessage);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          patient:patients(first_name, last_name, patient_code),
          doctor:staff(first_name, last_name, staff_code)
        `)
        .order('prescription_date', { ascending: false });

      if (error) throw error;
      setPrescriptions(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch prescriptions';
      setError(errorMessage);
    }
  };

  const createMedicine = async (medicineData: CreateMedicineData) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('medicines')
        .insert([medicineData])
        .select('*')
        .single();

      if (error) throw error;

      setMedicines(prev => [...prev, data]);
      
      toast({
        title: "Success",
        description: "Medicine created successfully",
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create medicine';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const createPrescription = async (prescriptionData: CreatePrescriptionData) => {
    try {
      setError(null);

      const { data: prescription, error: prescriptionError } = await supabase
        .from('prescriptions')
        .insert([prescriptionData])
        .select(`
          *,
          patient:patients(first_name, last_name, patient_code),
          doctor:staff(first_name, last_name, staff_code)
        `)
        .single();

      if (prescriptionError) throw prescriptionError;

      setPrescriptions(prev => [prescription, ...prev]);
      
      toast({
        title: "Success",
        description: "Prescription created successfully",
      });

      return prescription;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create prescription';
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
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMedicines(), fetchPrescriptions()]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  return {
    medicines,
    prescriptions,
    loading,
    error,
    fetchMedicines,
    fetchPrescriptions,
    createMedicine,
    createPrescription,
  };
};