import { Moon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NightModeIndicatorProps {
  sectorName?: string | null;
  startsAt?: string | null;
}

export function NightModeIndicator({ sectorName, startsAt }: NightModeIndicatorProps) {
  const startTime = startsAt
    ? new Date(startsAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="flex items-center gap-2 rounded-md bg-indigo-900/90 px-3 py-1.5 text-xs text-indigo-100">
      <Moon className="h-3.5 w-3.5" />
      <span className="font-medium">Plantao Noturno</span>
      {sectorName && (
        <>
          <span className="text-indigo-300">|</span>
          <span>{sectorName}</span>
        </>
      )}
      {startTime && (
        <>
          <span className="text-indigo-300">|</span>
          <span>Inicio: {startTime}</span>
        </>
      )}
    </div>
  );
}

export function NightShiftBadge() {
  return (
    <Badge variant="outline" className="border-indigo-500 bg-indigo-900/50 text-indigo-200 text-[10px] px-1.5 py-0">
      <Moon className="h-2.5 w-2.5 mr-0.5" />
      Noturno
    </Badge>
  );
}
