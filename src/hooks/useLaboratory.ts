import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LaboratoryTest {
  id: string;
  test_code: string;
  test_name: string;
  test_category: string;
  description?: string;
  normal_range?: string;
  unit?: string;
  sample_type: string;
  price?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LabTestOrder {
  id: string;
  patient_id: string;
  doctor_id: string;
  order_code: string;
  order_date: string;
  priority: string;
  status: string;
  clinical_history?: string;
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

export interface CreateTestOrderData {
  patient_id: string;
  doctor_id: string;
  order_code: string;
  priority?: 'urgent' | 'normal' | 'routine';
  clinical_history?: string;
  notes?: string;
  test_ids: string[];
}

export const useLaboratory = () => {
  const [tests, setTests] = useState<LaboratoryTest[]>([]);
  const [orders, setOrders] = useState<LabTestOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from('laboratory_tests')
        .select('*')
        .eq('is_active', true)
        .order('test_name');

      if (error) throw error;
      setTests(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch laboratory tests';
      setError(errorMessage);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('lab_test_orders')
        .select(`
          *,
          patient:patients(first_name, last_name, patient_code),
          doctor:staff(first_name, last_name, staff_code)
        `)
        .order('order_date', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch lab orders';
      setError(errorMessage);
    }
  };

  const createTestOrder = async (orderData: CreateTestOrderData) => {
    try {
      setError(null);

      const { test_ids, ...orderInfo } = orderData;

      const { data: order, error: orderError } = await supabase
        .from('lab_test_orders')
        .insert([orderInfo])
        .select(`
          *,
          patient:patients(first_name, last_name, patient_code),
          doctor:staff(first_name, last_name, staff_code)
        `)
        .single();

      if (orderError) throw orderError;

      setOrders(prev => [order, ...prev]);
      
      toast({
        title: "Success",
        description: "Lab test order created successfully",
      });

      return order;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create lab test order';
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
      await Promise.all([fetchTests(), fetchOrders()]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  return {
    tests,
    orders,
    loading,
    error,
    fetchTests,
    fetchOrders,
    createTestOrder,
  };
};