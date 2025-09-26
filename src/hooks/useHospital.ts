import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Ward {
  id: string;
  ward_code: string;
  name: string;
  description?: string;
  type: string;
  capacity: number;
  current_occupancy: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Bed {
  id: string;
  ward_id: string;
  bed_number: string;
  bed_type: string;
  status: string;
  current_patient_id?: string;
  created_at: string;
  updated_at: string;
  ward?: Ward;
  current_patient?: {
    first_name: string;
    last_name: string;
    patient_code: string;
  };
}

export interface CreateWardData {
  ward_code: string;
  name: string;
  description?: string;
  type: string;
  capacity: number;
}

export interface CreateBedData {
  ward_id: string;
  bed_number: string;
  bed_type: string;
}

export const useHospital = () => {
  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchWards = async () => {
    try {
      const { data, error } = await supabase
        .from('wards')
        .select('*')
        .order('name');

      if (error) throw error;
      setWards(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch wards';
      setError(errorMessage);
    }
  };

  const fetchBeds = async () => {
    try {
      const { data, error } = await supabase
        .from('beds')
        .select(`
          *,
          ward:wards(*),
          current_patient:patients(first_name, last_name, patient_code)
        `)
        .order('bed_number');

      if (error) throw error;
      setBeds(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch beds';
      setError(errorMessage);
    }
  };

  const createWard = async (wardData: CreateWardData) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('wards')
        .insert([{ ...wardData, current_occupancy: 0 }])
        .select('*')
        .single();

      if (error) throw error;

      setWards(prev => [...prev, data]);
      
      toast({
        title: "Success",
        description: "Ward created successfully",
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create ward';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const createBed = async (bedData: CreateBedData) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('beds')
        .insert([bedData])
        .select(`
          *,
          ward:wards(*),
          current_patient:patients(first_name, last_name, patient_code)
        `)
        .single();

      if (error) throw error;

      setBeds(prev => [...prev, data]);
      
      toast({
        title: "Success",
        description: "Bed created successfully",
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create bed';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const getAvailableBeds = (wardId?: string) => {
    let availableBeds = beds.filter(bed => bed.status === 'available');
    
    if (wardId) {
      availableBeds = availableBeds.filter(bed => bed.ward_id === wardId);
    }
    
    return availableBeds;
  };

  const getBedsByWard = (wardId: string) => {
    return beds.filter(bed => bed.ward_id === wardId);
  };

  const getWardOccupancy = (wardId: string) => {
    const ward = wards.find(w => w.id === wardId);
    if (!ward) return { occupied: 0, total: 0, percentage: 0 };

    const wardBeds = beds.filter(b => b.ward_id === wardId);
    const occupied = wardBeds.filter(b => b.status === 'occupied').length;
    const total = wardBeds.length;
    const percentage = total > 0 ? Math.round((occupied / total) * 100) : 0;

    return { occupied, total, percentage };
  };

  const getTotalOccupancy = () => {
    const totalBeds = beds.length;
    const occupiedBeds = beds.filter(bed => bed.status === 'occupied').length;
    const percentage = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    return { occupied: occupiedBeds, total: totalBeds, percentage };
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchWards(), fetchBeds()]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  return {
    wards,
    beds,
    loading,
    error,
    fetchWards,
    fetchBeds,
    createWard,
    createBed,
    getAvailableBeds,
    getBedsByWard,
    getWardOccupancy,
    getTotalOccupancy,
  };
};