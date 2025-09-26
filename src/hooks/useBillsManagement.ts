import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Bill {
  id: string;
  patient_id: string;
  bill_number: string;
  bill_date: string;
  due_date?: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  payment_method?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Related data
  patients?: {
    id: string;
    first_name: string;
    last_name: string;
    patient_code: string;
  };
  bill_details?: {
    id: string;
    item_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    billing_items?: {
      item_name: string;
      item_code: string;
    };
  }[];
}

export interface CreateBillData {
  patient_id: string;
  due_date?: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  notes?: string;
  items: {
    item_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
}

export function useBillsManagement() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBills = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bills')
        .select(`
          *,
          patients!bills_patient_id_fkey (
            id,
            first_name,
            last_name,
            patient_code
          ),
          bill_details (
            id,
            item_id,
            quantity,
            unit_price,
            total_price,
            billing_items!bill_details_item_id_fkey (
              item_name,
              item_code
            )
          )
        `)
        .order('bill_date', { ascending: false });

      if (error) throw error;
      setBills((data || []) as unknown as Bill[]);
    } catch (error: any) {
      console.error('Error fetching bills:', error);
      toast({
        title: "Erro ao carregar faturas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createBill = async (billData: CreateBillData) => {
    try {
      // Generate bill number
      const billNumber = `BILL${Date.now()}`;
      
      const { data: bill, error: billError } = await supabase
        .from('bills')
        .insert([{
          ...billData,
          bill_number: billNumber,
          items: undefined, // Remove items from bill data
        }])
        .select()
        .single();

      if (billError) throw billError;

      // Create bill details
      const billDetails = billData.items.map(item => ({
        ...item,
        bill_id: bill.id,
      }));

      const { error: detailsError } = await supabase
        .from('bill_details')
        .insert(billDetails);

      if (detailsError) throw detailsError;

      // Refresh bills list
      await fetchBills();
      
      toast({
        title: "Sucesso",
        description: "Fatura criada com sucesso!",
      });
      
      return bill;
    } catch (error: any) {
      console.error('Error creating bill:', error);
      toast({
        title: "Erro ao criar fatura",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateBillStatus = async (id: string, status: Bill['status'], paymentMethod?: string) => {
    try {
      const updateData: any = { status };
      if (paymentMethod) {
        updateData.payment_method = paymentMethod;
      }
      if (status === 'paid') {
        updateData.paid_amount = bills.find(b => b.id === id)?.total_amount || 0;
      }

      const { data, error } = await supabase
        .from('bills')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setBills(prev => prev.map(b => b.id === id ? { ...b, ...updateData } : b));
      toast({
        title: "Sucesso",
        description: "Status da fatura atualizado com sucesso!",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error updating bill status:', error);
      toast({
        title: "Erro ao atualizar fatura",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteBill = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBills(prev => prev.filter(b => b.id !== id));
      toast({
        title: "Sucesso",
        description: "Fatura removida com sucesso!",
      });
    } catch (error: any) {
      console.error('Error deleting bill:', error);
      toast({
        title: "Erro ao remover fatura",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  return {
    bills,
    loading,
    createBill,
    updateBillStatus,
    deleteBill,
    refetch: fetchBills,
  };
}