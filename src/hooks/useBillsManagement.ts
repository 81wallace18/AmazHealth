import { useCallback, useEffect, useState } from "react";
import { billingService } from "@/services/billingService";
import type { Bill } from "@/types/billing";

export function useBillsManagement() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const page = await billingService.findAll(0, 50);
      setBills(page.content ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateBillStatus = async (
    id: string,
    status: Bill["status"],
    method?: string,
    paidAmount?: number,
    notes?: string
  ) => {
    await billingService.updateStatus(id, {
      status,
      paymentMethod: method,
      paidAmount,
      notes,
    });
    await load();
  };

  const createBill = async (input: Parameters<typeof billingService.create>[0]) => {
    await billingService.create(input);
    await load();
  };

  return {
    bills,
    loading,
    updateBillStatus,
    createBill,
    refetch: load,
  };
}
