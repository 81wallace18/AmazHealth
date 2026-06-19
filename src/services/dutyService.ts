import api from '@/lib/api';

export interface StartDutyRequest {
  staffId: string;
  sectorId: string;
  shiftType: 'DAY' | 'NIGHT';
  endsAt?: string;
}

export interface DutyResponse {
  id: string;
  organizationId: string;
  staffId: string;
  staffName: string | null;
  sectorId: string;
  sectorName: string | null;
  shiftType: 'DAY' | 'NIGHT';
  startsAt: string;
  endsAt: string | null;
  active: boolean;
  createdAt: string;
}

export interface ReviewResponse {
  id: string;
  dutyAssignmentId: string;
  actorStaffId: string;
  actorStaffName: string | null;
  actionType: string;
  entityType: string;
  entityId: string;
  shiftType: 'DAY' | 'NIGHT';
  reviewStatus: 'PENDING_REVIEW' | 'REVIEWED' | 'CLEARED';
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  createdAt: string;
}

export interface ReviewRequest {
  reviewNotes?: string;
}

class DutyService {
  async startDuty(data: StartDutyRequest): Promise<DutyResponse> {
    const response = await api.post<DutyResponse>('/duties/start', data);
    return response.data;
  }

  async endDuty(id: string): Promise<void> {
    await api.post(`/duties/${id}/end`);
  }

  async getActiveDuties(): Promise<DutyResponse[]> {
    const response = await api.get<DutyResponse[]>('/duties/active');
    return response.data;
  }

  async getMyCurrentDuty(): Promise<DutyResponse | null> {
    const response = await api.get<DutyResponse>('/duties/my-current');
    if (response.status === 204) return null;
    return response.data;
  }

  async getPendingReviews(page = 0, size = 20): Promise<{ content: ReviewResponse[]; totalElements: number; totalPages: number }> {
    const response = await api.get('/reviews/pending', { params: { page, size } });
    return response.data;
  }

  async getActionsByDuty(dutyId: string): Promise<ReviewResponse[]> {
    const response = await api.get<ReviewResponse[]>(`/reviews/by-duty/${dutyId}`);
    return response.data;
  }

  async reviewAction(id: string, data?: ReviewRequest): Promise<ReviewResponse> {
    const response = await api.patch<ReviewResponse>(`/reviews/${id}/review`, data || {});
    return response.data;
  }

  async clearAction(id: string, data?: ReviewRequest): Promise<ReviewResponse> {
    const response = await api.patch<ReviewResponse>(`/reviews/${id}/clear`, data || {});
    return response.data;
  }
}

export default new DutyService();
