import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { bedService, type Bed } from "@/services/bedService";
import { wardService, type Ward } from "@/services/wardService";

interface HospitalWard {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  current_occupancy: number;
  status: "active" | "inactive";
}

export function useHospital() {
  const [wards, setWards] = useState<HospitalWard[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);

  const mapWard = (ward: Ward): HospitalWard => {
    const capacity = ward.capacityLimit ?? ward.totalBeds ?? 0;
    const occupied = ward.occupiedBeds ?? Math.max(capacity - (ward.availableBeds ?? 0), 0);

    return {
      id: ward.id,
      name: ward.name,
      description: ward.description,
      capacity,
      current_occupancy: occupied,
      status: ward.status,
    };
  };

  const fetchHospital = useCallback(async () => {
    try {
      setLoading(true);
      const [wardResponse, bedResponse] = await Promise.all([
        wardService.list(0, 100, "name", "asc"),
        bedService.list(0, 200, "bedNumber", "asc"),
      ]);

      setWards(wardResponse.content.map(mapWard));
      setBeds(bedResponse.content ?? []);
    } catch (error: any) {
      console.error("Error fetching hospital data:", error);
      toast.error(error?.response?.data?.message || "Nao foi possivel carregar enfermarias.");
      setWards([]);
      setBeds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHospital();
  }, [fetchHospital]);

  return {
    wards,
    beds,
    loading,
    refetch: fetchHospital,
  };
}
