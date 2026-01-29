import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { admissionService } from "@/services/admissionService";
import type { Admission, AdmissionRequest, DischargeRequest } from "@/types/admission";

export function useAdmissions() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdmissions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await admissionService.findAll({ page: 0, size: 50 });
      setAdmissions(response.content ?? []);
    } catch (error: any) {
      console.error("Error fetching admissions:", error);
      toast.error(error?.response?.data?.message || "Nao foi possivel carregar internacoes.");
      setAdmissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmissions();
  }, [fetchAdmissions]);

  const addAdmission = async (data: AdmissionRequest) => {
    const created = await admissionService.create(data);
    setAdmissions((prev) => [created, ...prev]);
    toast.success("Internacao registrada com sucesso.");
    return created;
  };

  const dischargePatient = async (admissionId: string, dischargeData: DischargeRequest) => {
    const updated = await admissionService.discharge(admissionId, dischargeData);
    setAdmissions((prev) => prev.map((item) => (item.id === admissionId ? updated : item)));
    toast.success("Alta registrada com sucesso.");
    return updated;
  };

  return {
    admissions,
    loading,
    addAdmission,
    dischargePatient,
    refetch: fetchAdmissions,
  };
}
