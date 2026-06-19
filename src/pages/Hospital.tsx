import type { ComponentType, SVGProps } from 'react';

import { Activity, BedDouble, LineChart, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { BedBoardMap } from '@/components/admissions/BedBoardMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { admissionService } from '@/services/admissionService';

export default function Hospital() {
  const summaryQuery = useQuery({
    queryKey: ['bed-board', 'summary'],
    queryFn: () => admissionService.getBedBoardSummary(),
    refetchInterval: 60 * 1000,
  });

  const summary = summaryQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ocupação Hospitalar</h1>
        <p className="text-muted-foreground text-sm">
          Panorama geral dos leitos, ocupação por enfermaria e mapa interativo.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Leitos Totais"
          value={summary?.totalBeds ?? '--'}
          description={`${summary?.totalWards ?? 0} enfermarias`}
          icon={BedDouble}
        />
        <SummaryCard
          title="Ocupados"
          value={summary?.totalOccupied ?? '--'}
          description={`Disponíveis: ${summary?.totalAvailable ?? 0}`}
          icon={Activity}
        />
        <SummaryCard
          title="Em Manutenção"
          value={summary?.totalMaintenance ?? '--'}
          description={`Limpeza: ${summary?.totalCleaning ?? 0}`}
          icon={LineChart}
        />
        <SummaryCard
          title="Enfermarias ativas"
          value={summary?.activeWards ?? '--'}
          description={`${summary?.fullWards ?? 0} lotadas`}
          icon={Users}
        />
      </div>

      <BedBoardMap />
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

function SummaryCard({ title, value, description, icon: Icon }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
