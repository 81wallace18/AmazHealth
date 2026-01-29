import { useEffect, useState } from "react";

export interface LabOrder {
  id: string;
  order_code: string;
  order_date: string;
  status: "pending" | "collected" | "processing" | "completed" | "cancelled";
  priority: "normal" | "urgent" | "stat";
  clinical_history?: string;
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    patient_code?: string;
  };
  doctor?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export function useLaboratory() {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const createTestOrder = async (_payload: unknown) => {
    return;
  };

  return {
    orders,
    loading,
    createTestOrder,
  };
}
