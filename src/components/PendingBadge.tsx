import { CloudOff, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  status: 'PENDING' | 'SENT' | 'CONFLICT' | 'REJECTED';
  className?: string;
}

const LABEL: Record<Props['status'], string> = {
  PENDING: 'Pendente — aguardando sincronização',
  SENT: 'Enviado — aguardando confirmação',
  CONFLICT: 'Conflito — requer revisão',
  REJECTED: 'Rejeitado pelo servidor',
};

const COLOR: Record<Props['status'], string> = {
  PENDING: 'text-amber-600',
  SENT: 'text-blue-600',
  CONFLICT: 'text-red-600',
  REJECTED: 'text-red-700',
};

export function PendingBadge({ status, className }: Props) {
  const Icon = status === 'PENDING' || status === 'SENT' ? RefreshCw : CloudOff;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center ${COLOR[status]} ${className ?? ''}`}>
            <Icon className="h-3.5 w-3.5" />
          </span>
        </TooltipTrigger>
        <TooltipContent>{LABEL[status]}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
