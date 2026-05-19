import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { pharmacyService } from "@/services/pharmacyService";
import type { HorusAuditEvent } from "@/types/pharmacy";
import { History } from "lucide-react";

export function HorusAuditLog() {
  const [events, setEvents] = useState<HorusAuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
        setLoading(true);
        try {
        setError(null);
        const response = await pharmacyService.getHorusAudit({ page: 0, size: 50 });
        setEvents(response.content);
      } catch (err: any) {
        setError(err.message || "Não foi possível carregar a auditoria da integração legada.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5" />
          Auditoria da integração legada
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {error && (
          <Alert variant="destructive" className="mx-4 mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Carregando trilha de auditoria...</div>
        ) : events.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">Nenhum evento auditável da integração legada encontrado.</div>
        ) : (
          <ScrollArea className="h-[420px]">
            <div className="space-y-3 p-4">
              {events.map((event) => (
                <div key={event.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{event.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.createdAt).toLocaleString("pt-BR")} • {event.entity}
                      </p>
                    </div>
                    <Badge variant="outline">{event.entityId ?? "sem entidade"}</Badge>
                  </div>
                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <dl className="mt-3 grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
                      {Object.entries(event.metadata).map(([key, value]) => (
                        <div key={key}>
                          <dt className="font-medium text-foreground">{key}</dt>
                          <dd>{String(value ?? "—")}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
