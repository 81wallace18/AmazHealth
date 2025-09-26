import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BillingCategory {
  id: string;
  category_code: string;
  category_name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BillingItem {
  id: string;
  item_code: string;
  item_name: string;
  category_id: string;
  price: number;
  tax_rate: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: BillingCategory;
}

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
  status: string;
  payment_method?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  patient?: {
    first_name: string;
    last_name: string;
    patient_code: string;
  };
}

export interface CreateBillingCategoryData {
  category_code: string;
  category_name: string;
  description?: string;
}

export interface CreateBillingItemData {
  item_code: string;
  item_name: string;
  category_id: string;
  price: number;
  tax_rate?: number;
  description?: string;
}

export interface CreateBillData {
  patient_id: string;
  bill_number: string;
  due_date?: string;
  discount_amount?: number;
  payment_method?: string;
  notes?: string;
  items: Array<{
    item_id: string;
    quantity: number;
    unit_price: number;
  }>;
}

export const useBilling = () => {
  const [categories, setCategories] = useState<BillingCategory[]>([]);
  const [items, setItems] = useState<BillingItem[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('billing_categories')
        .select('*')
        .eq('is_active', true)
        .order('category_name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch billing categories';
      setError(errorMessage);
    }
  };

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('billing_items')
        .select(`
          *,
          category:billing_categories(*)
        `)
        .eq('is_active', true)
        .order('item_name');

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch billing items';
      setError(errorMessage);
    }
  };

  const fetchBills = async () => {
    try {
      const { data, error } = await supabase
        .from('bills')
        .select(`
          *,
          patient:patients(first_name, last_name, patient_code)
        `)
        .order('bill_date', { ascending: false });

      if (error) throw error;
      setBills(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch bills';
      setError(errorMessage);
    }
  };

  const createCategory = async (categoryData: CreateBillingCategoryData) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('billing_categories')
        .insert([categoryData])
        .select('*')
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data]);
      
      toast({
        title: "Success",
        description: "Billing category created successfully",
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create billing category';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const createItem = async (itemData: CreateBillingItemData) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('billing_items')
        .insert([itemData])
        .select(`
          *,
          category:billing_categories(*)
        `)
        .single();

      if (error) throw error;

      setItems(prev => [...prev, data]);
      
      toast({
        title: "Success",
        description: "Billing item created successfully",
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create billing item';
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
      await Promise.all([fetchCategories(), fetchItems(), fetchBills()]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  return {
    categories,
    items,
    bills,
    loading,
    error,
    fetchCategories,
    fetchItems,
    fetchBills,
    createCategory,
    createItem,
  };
};