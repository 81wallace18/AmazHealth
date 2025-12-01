import api from '@/lib/api';
import {
  ActivateAccountRequest,
  CreateUserRequest,
  CreateUserResponse,
  PageResponse,
  UpdateUserRoleRequest,
  UpdateUserStatusRequest,
  User,
} from '@/types/user';

class UserService {
  private baseUrl = '/users';

  async findAll(page = 0, size = 20): Promise<PageResponse<User>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    const response = await api.get<PageResponse<User>>(`${this.baseUrl}?${params.toString()}`);
    return response.data;
  }

  async findById(id: string): Promise<User> {
    const response = await api.get<User>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async create(data: CreateUserRequest): Promise<CreateUserResponse> {
    const response = await api.post<CreateUserResponse>(this.baseUrl, data);
    return response.data;
  }

  async updateRole(id: string, data: UpdateUserRoleRequest): Promise<User> {
    const response = await api.put<User>(`${this.baseUrl}/${id}/role`, data);
    return response.data;
  }

  async updateStatus(id: string, data: UpdateUserStatusRequest): Promise<User> {
    const response = await api.patch<User>(`${this.baseUrl}/${id}/status`, data);
    return response.data;
  }

  async removeFromOrganization(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  async activateAccount(request: ActivateAccountRequest) {
    const response = await api.post('/auth/activate', request);
    return response.data;
  }
}

export const userService = new UserService();
export default userService;

