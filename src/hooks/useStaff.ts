import { useEffect, useState } from "react";
import { staffService, type Staff } from "@/services/staffService";

export function useStaff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const page = await staffService.findAll({ page: 0, size: 200 });
      setStaff(page.content ?? []);
    } catch (err: any) {
      const message = err?.response?.data?.message || "Erro ao carregar equipe.";
      setError(message);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return {
    staff,
    loading,
    error,
    refetch: load,
  };
}

