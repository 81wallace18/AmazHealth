import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { pharmacyService } from "@/services/pharmacyService";
import type { PharmacyDashboardData, PharmacyStatistics } from "@/types/pharmacy";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Activity, Boxes, ClipboardCheck, TriangleAlert } from "lucide-react";

export function PharmacyDashboard() {
  const [summary, setSummary] = useState<PharmacyDashboardData | null>(null);
  const [stats, setStats] = useState<PharmacyStatistics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        setError(null);
        const [dashboardData, statistics] = await Promise.all([
          pharmacyService.getDashboardData(),
          pharmacyService.getStatistics()
        ]);
        setSummary(dashboardData);
        setStats(statistics);
      } catch (err: any) {
        setError(err.message || "Não foi possível carregar o dashboard da farmácia.");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (loading || !summary || !stats) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Carregando informações da farmácia...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Medicamentos ativos"
          value={summary.totalMedicines}
          icon={<Boxes className="h-5 w-5 text-primary" />}
        />
        <DashboardCard
          title="Itens para reposição"
          value={summary.medicinesNeedingReorder}
          icon={<ClipboardCheck className="h-5 w-5 text-amber-500" />}
        />
        <DashboardCard
          title="Alertas ativos"
          value={summary.inventoryAlerts}
          icon={<TriangleAlert className="h-5 w-5 text-red-500" />}
        />
        <DashboardCard
          title="Lotes críticos"
          value={stats.expired + stats.nearExpiry}
          icon={<Activity className="h-5 w-5 text-blue-500" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status do Estoque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(summary.stockByStatus).map(([status, value]) => (
              <StatusRow key={status} label={status} value={value} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estoque por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(summary.stockByCategory).map(([category, value]) => (
              <StatusRow key={category} label={category} value={value} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface DashboardCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
}

function DashboardCard({ title, value, icon }: DashboardCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold">{value}</p>
        </div>
        <div className="rounded-full bg-muted p-3">{icon}</div>
      </CardContent>
    </Card>
  );
}

function StatusRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm font-medium">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <Separator className="my-2" />
    </div>
  );
}
