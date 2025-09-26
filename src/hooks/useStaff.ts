import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Staff {
  id: string;
  staff_code: string;
  first_name: string;
  last_name: string;
  role: string;
  specialization?: string;
  phone?: string;
  email?: string;
  hire_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useStaff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaff(data || []);
    } catch (error: any) {
      console.error('Error fetching staff:', error);
      toast({
        title: "Erro ao carregar funcionários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addStaff = async (staffData: Omit<Staff, 'id' | 'created_at' | 'updated_at' | 'staff_code'>) => {
    try {
      // Generate staff code
      const staffCode = `STF${Date.now()}`;
      
      const { data, error } = await supabase
        .from('staff')
        .insert([{ ...staffData, staff_code: staffCode }])
        .select()
        .single();

      if (error) throw error;

      setStaff(prev => [data, ...prev]);
      toast({
        title: "Sucesso",
        description: "Funcionário cadastrado com sucesso!",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error adding staff:', error);
      toast({
        title: "Erro ao cadastrar funcionário",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  return {
    staff,
    loading,
    addStaff,
    refetch: fetchStaff,
  };
}