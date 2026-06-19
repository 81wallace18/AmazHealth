import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReceptionQueueList } from "@/components/reception/ReceptionQueueList";
import receptionService from "@/services/receptionService";
import type { ReceptionQueueItem } from "@/types/reception";

export default function ReceptionQueue() {
  const [items, setItems] = useState<ReceptionQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadItems = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await receptionService.listQueue();
      setItems(data);
    } catch (error) {
      console.error("Erro ao carregar andamento da recepção:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Andamento</h1>
          <p className="text-muted-foreground">Acompanhamento operacional dos atendimentos</p>
        </div>
        <Button variant="outline" onClick={loadItems} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Carregando andamento...</div>
      ) : (
        <ReceptionQueueList
          title="Atendimentos em andamento"
          items={items}
          emptyMessage="Nenhum atendimento em andamento."
        />
      )}
    </div>
  );
}
