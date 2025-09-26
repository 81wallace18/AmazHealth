import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Admission {
  id: string;
  admission_code: string;
  patient_id: string;
  doctor_id: string;
  bed_id?: string;
  admission_date: string;
  discharge_date?: string;
  admission_type: string;
  reason_for_admission: string;
  diagnosis?: string;
  treatment_plan?: string;
  discharge_summary?: string;
  notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
  // Relations
  patient?: {
    first_name: string;
    last_name: string;
    patient_code: string;
  };
  doctor?: {
    first_name: string;
    last_name: string;
    specialization?: string;
  };
  bed?: {
    bed_number: string;
    ward_id: string;
    ward?: {
      name: string;
      ward_code: string;
    };
  };
}

export function useAdmissions() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAdmissions = async (patientId?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('admissions')
        .select(`
          *,
          patient:patients(first_name, last_name, patient_code),
          doctor:staff(first_name, last_name, specialization),
          bed:beds(
            bed_number,
            ward_id,
            ward:wards(name, ward_code)
          )
        `)
        .order('admission_date', { ascending: false });

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAdmissions(data || []);
    } catch (error: any) {
      console.error('Error fetching admissions:', error);
      toast({
        title: "Erro ao carregar internações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addAdmission = async (admissionData: Omit<Admission, 'id' | 'created_at' | 'updated_at' | 'admission_code' | 'patient' | 'doctor' | 'bed'>) => {
    try {
      const admissionCode = `ADM${Date.now()}`;
      
      const { data, error } = await supabase
        .from('admissions')
        .insert([{ ...admissionData, admission_code: admissionCode }])
        .select(`
          *,
          patient:patients(first_name, last_name, patient_code),
          doctor:staff(first_name, last_name, specialization),
          bed:beds(
            bed_number,
            ward_id,
            ward:wards(name, ward_code)
          )
        `)
        .single();

      if (error) throw error;

      // Update bed status if bed is assigned
      if (admissionData.bed_id) {
        await supabase
          .from('beds')
          .update({ 
            status: 'occupied',
            current_patient_id: admissionData.patient_id
          })
          .eq('id', admissionData.bed_id);

        // Update ward occupancy
        const { data: bedData } = await supabase
          .from('beds')
          .select('ward_id')
          .eq('id', admissionData.bed_id)
          .single();

        if (bedData) {
          const { data: wardBeds } = await supabase
            .from('beds')
            .select('id')
            .eq('ward_id', bedData.ward_id)
            .eq('status', 'occupied');

          await supabase
            .from('wards')
            .update({ current_occupancy: wardBeds?.length || 0 })
            .eq('id', bedData.ward_id);
        }
      }

      setAdmissions(prev => [data, ...prev]);
      toast({
        title: "Sucesso",
        description: "Internação registrada com sucesso!",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error adding admission:', error);
      toast({
        title: "Erro ao registrar internação",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateAdmission = async (id: string, updates: Partial<Admission>) => {
    try {
      const { data, error } = await supabase
        .from('admissions')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          patient:patients(first_name, last_name, patient_code),
          doctor:staff(first_name, last_name, specialization),
          bed:beds(
            bed_number,
            ward_id,
            ward:wards(name, ward_code)
          )
        `)
        .single();

      if (error) throw error;

      setAdmissions(prev => prev.map(a => a.id === id ? data : a));
      toast({
        title: "Sucesso",
        description: "Internação atualizada com sucesso!",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error updating admission:', error);
      toast({
        title: "Erro ao atualizar internação",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const dischargePatient = async (admissionId: string, dischargeData: { discharge_date: string; discharge_summary?: string }) => {
    try {
      // Get admission data to free up the bed
      const { data: admission } = await supabase
        .from('admissions')
        .select('bed_id, patient_id')
        .eq('id', admissionId)
        .single();

      // Update admission with discharge info
      const { data, error } = await supabase
        .from('admissions')
        .update({ 
          ...dischargeData,
          status: 'discharged'
        })
        .eq('id', admissionId)
        .select(`
          *,
          patient:patients(first_name, last_name, patient_code),
          doctor:staff(first_name, last_name, specialization),
          bed:beds(
            bed_number,
            ward_id,
            ward:wards(name, ward_code)
          )
        `)
        .single();

      if (error) throw error;

      // Free up the bed if one was assigned
      if (admission?.bed_id) {
        await supabase
          .from('beds')
          .update({ 
            status: 'available',
            current_patient_id: null
          })
          .eq('id', admission.bed_id);

        // Update ward occupancy
        const { data: bedData } = await supabase
          .from('beds')
          .select('ward_id')
          .eq('id', admission.bed_id)
          .single();

        if (bedData) {
          const { data: wardBeds } = await supabase
            .from('beds')
            .select('id')
            .eq('ward_id', bedData.ward_id)
            .eq('status', 'occupied');

          await supabase
            .from('wards')
            .update({ current_occupancy: wardBeds?.length || 0 })
            .eq('id', bedData.ward_id);
        }
      }

      setAdmissions(prev => prev.map(a => a.id === admissionId ? data : a));
      toast({
        title: "Sucesso",
        description: "Paciente teve alta com sucesso!",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error discharging patient:', error);
      toast({
        title: "Erro ao dar alta ao paciente",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, []);

  return {
    admissions,
    loading,
    addAdmission,
    updateAdmission,
    dischargePatient,
    refetch: fetchAdmissions,
    fetchByPatient: (patientId: string) => fetchAdmissions(patientId),
  };
}