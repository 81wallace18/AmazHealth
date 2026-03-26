import { Badge } from '@/components/ui/badge';
import type { NotificationStatus } from '@/types/notification';

interface NotificationBadgeProps {
  status: NotificationStatus;
  className?: string;
}

const statusConfig: Record<NotificationStatus, { label: string; variant: 'destructive' | 'secondary' | 'default' }> = {
  PENDING: { label: 'Notificação pendente', variant: 'destructive' },
  COMPLETED: { label: 'Notificação completa', variant: 'secondary' },
  SENT: { label: 'Notificação enviada', variant: 'default' },
};

export function NotificationBadge({ status, className }: NotificationBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
