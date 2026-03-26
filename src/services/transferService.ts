import api from '@/lib/api';
import type {
  TransferDocumentRequest,
  TransferDocumentResponse,
  TransferConfirmRequest,
} from '@/types/transfer';

class TransferService {
  async create(data: TransferDocumentRequest): Promise<TransferDocumentResponse> {
    const response = await api.post<TransferDocumentResponse>('/transfers', data);
    return response.data;
  }

  async findByVisit(visitId: string): Promise<TransferDocumentResponse[]> {
    const response = await api.get<TransferDocumentResponse[]>(`/transfers/visit/${visitId}`);
    return response.data;
  }

  async findById(id: string): Promise<TransferDocumentResponse> {
    const response = await api.get<TransferDocumentResponse>(`/transfers/${id}`);
    return response.data;
  }

  async confirmDelivery(id: string, data: TransferConfirmRequest): Promise<TransferDocumentResponse> {
    const response = await api.patch<TransferDocumentResponse>(`/transfers/${id}/confirm`, data);
    return response.data;
  }
}

export default new TransferService();
