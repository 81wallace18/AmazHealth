export type NotificationType =
  | 'ACIDENTE_TRABALHO'
  | 'MATERIAL_PERFUROCORTANTE'
  | 'MORDEDURA_ANIMAL'
  | 'INTOXICACAO'
  | 'VIOLENCIA'
  | 'AGRAVO_NOTIFICACAO_OBRIGATORIA'
  | 'OUTRO';

export type NotificationStatus = 'PENDING' | 'COMPLETED' | 'SENT';

export interface CompulsoryNotificationRequest {
  visitId: string;
  notificationType: NotificationType;
  diseaseCode?: string;
  diseaseDescription?: string;
  description: string;
  clinicalFindings?: string;
  attachments?: string[];
}

export interface CompulsoryNotificationResponse {
  id: string;
  visitId: string;
  patientId: string;
  notificationType: NotificationType;
  diseaseCode?: string;
  diseaseDescription?: string;
  description: string;
  clinicalFindings?: string;
  attachments?: string[];
  status: NotificationStatus;
  completedAt?: string;
  sentTo?: string;
  sentAt?: string;
  createdByStaffId: string;
  createdAt: string;
}
