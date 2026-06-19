import api from '@/lib/api';
import type {
  CompulsoryNotificationRequest,
  CompulsoryNotificationResponse,
} from '@/types/notification';

class NotificationService {
  async create(data: CompulsoryNotificationRequest): Promise<CompulsoryNotificationResponse> {
    const response = await api.post<CompulsoryNotificationResponse>('/notifications', data);
    return response.data;
  }

  async findByVisit(visitId: string): Promise<CompulsoryNotificationResponse[]> {
    const response = await api.get<CompulsoryNotificationResponse[]>(`/notifications/visit/${visitId}`);
    return response.data;
  }

  async complete(id: string): Promise<CompulsoryNotificationResponse> {
    const response = await api.patch<CompulsoryNotificationResponse>(`/notifications/${id}/complete`);
    return response.data;
  }

  async markAsSent(id: string, sentTo: string): Promise<CompulsoryNotificationResponse> {
    const response = await api.patch<CompulsoryNotificationResponse>(`/notifications/${id}/sent`, { sentTo });
    return response.data;
  }

  async flagVisit(visitId: string, required: boolean): Promise<void> {
    await api.patch(`/notifications/visit/${visitId}/flag`, { notificationRequired: required });
  }
}

export default new NotificationService();
