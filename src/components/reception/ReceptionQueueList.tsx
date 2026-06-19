import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ReceptionQueueItem } from "@/types/reception";
import { MANCHESTER_COLORS } from "@/types/triage";

interface ReceptionQueueListProps {
  title: string;
  items: ReceptionQueueItem[];
  emptyMessage: string;
}

export function ReceptionQueueList({ title, items, emptyMessage }: ReceptionQueueListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">{emptyMessage}</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Cor Manchester</TableHead>
                  <TableHead>Área/Serviço</TableHead>
                  <TableHead>Tempo de espera</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => {
                  const colorInfo = item.triageColor ? MANCHESTER_COLORS[item.triageColor] : null;
                  return (
                    <TableRow key={`${item.patientCode}-${index}`}>
                      <TableCell className="font-mono text-sm">{item.patientCode}</TableCell>
                      <TableCell className="font-medium">{item.patientName}</TableCell>
                      <TableCell>
                        {item.triageColor && colorInfo ? (
                          <Badge className={`${colorInfo.bgColor} ${colorInfo.textColor}`}>
                            {colorInfo.label}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Sem classificação</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.areaName || '-'}
                        {item.serviceName ? ` · ${item.serviceName}` : ''}
                      </TableCell>
                      <TableCell>{item.waitingTimeMinutes} min</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
