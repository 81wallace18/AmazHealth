import { useCallback, useEffect, useState } from "react";
import labTestService from "@/services/labTestService";
import type { LabTestOrder, LabTestOrderRequest, LabTestStatusUpdateRequest } from "@/types/labTest";

export function useLaboratory() {
  const [orders, setOrders] = useState<LabTestOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const response = await labTestService.list();
      setOrders(response.content);
    } catch (err: any) {
      setError(err?.message || "Não foi possível carregar os exames.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const createTestOrder = async (payload: LabTestOrderRequest) => {
    const created = await labTestService.createOrder(payload);
    setOrders((prev) => [created, ...prev]);
    return created;
  };

  const updateTestOrderStatus = async (orderId: string, payload: LabTestStatusUpdateRequest) => {
    const updated = await labTestService.updateStatus(orderId, payload);
    setOrders((prev) => prev.map((order) => (order.id === orderId ? updated : order)));
    return updated;
  };

  return {
    orders,
    loading,
    error,
    reload: loadOrders,
    createTestOrder,
    updateTestOrderStatus,
  };
}
