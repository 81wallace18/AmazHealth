import api from '@/lib/api';

export type RoleType = 'doctor' | 'nurse' | 'admin' | 'receptionist' | 'pharmacist' | 'lab_technician';
export type StaffStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';

export interface Staff {
  id: string;
  organizationId: string;
  staffCode: string;
  firstName: string;
  lastName: string;
  role: RoleType;
  specialization?: string;
  phone?: string;
  email?: string;
  hireDate?: string; // LocalDate ISO format
  status: StaffStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StaffRequest {
  firstName: string;
  lastName: string;
  role: RoleType;
  specialization?: string;
  phone?: string;
  email?: string;
  hireDate?: string; // LocalDate ISO format
  status?: StaffStatus;
}

export interface StaffSearchParams {
  status?: StaffStatus;
  role?: RoleType;
  q?: string; // query de busca
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'ASC' | 'DESC';
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

class StaffService {
  private baseUrl = '/staff';

  /**
   * Lista todos os profissionais com paginação e filtros
   */
  async findAll(params?: StaffSearchParams): Promise<PageResponse<Staff>> {
    const queryParams = new URLSearchParams();

    if (params?.status) queryParams.append('status', params.status);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.q) queryParams.append('q', params.q);
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size !== undefined) queryParams.append('size', params.size.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.direction) queryParams.append('direction', params.direction);

    const response = await api.get(`${this.baseUrl}?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Busca profissional por ID
   */
  async findById(id: string): Promise<Staff> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Lista médicos ativos (para dropdowns)
   */
  async findActiveDoctors(): Promise<Staff[]> {
    const response = await api.get(`${this.baseUrl}/doctors/active`);
    return response.data;
  }

  /**
   * Cria novo profissional
   */
  async create(data: StaffRequest): Promise<Staff> {
    const response = await api.post(this.baseUrl, data);
    return response.data;
  }

  /**
   * Atualiza profissional existente
   */
  async update(id: string, data: StaffRequest): Promise<Staff> {
    const response = await api.put(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  /**
   * Remove profissional (soft delete)
   */
  async delete(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Conta profissionais por role
   */
  async countByRole(role: RoleType): Promise<number> {
    const response = await api.get(`${this.baseUrl}/count/by-role?role=${role}`);
    return response.data;
  }

  /**
   * Busca profissionais (wrapper simplificado para busca)
   */
  async search(query: string, page = 0, size = 20): Promise<PageResponse<Staff>> {
    return this.findAll({ q: query, page, size });
  }
}

export const staffService = new StaffService();
export default staffService;
