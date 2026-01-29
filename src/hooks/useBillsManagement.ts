import { useEffect, useState } from "react";

export interface Bill {
  id: string;
  bill_number: string;
  bill_date: string;
  due_date?: string;
  total_amount: number;
  discount_amount: number;
  status: "paid" | "pending" | "overdue" | "cancelled" | "partial";
  patients?: {
    id: string;
    first_name: string;
    last_name: string;
    patient_code?: string;
  };
}

export function useBillsManagement() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const updateBillStatus = async (_id: string, _status: Bill["status"], _method?: string) => {
    return;
  };

  return {
    bills,
    loading,
    updateBillStatus,
  };
}
