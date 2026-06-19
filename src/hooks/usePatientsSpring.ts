import { useState, useEffect } from 'react';
import { patientService } from '@/services/patientService';
import { useToast } from '@/hooks/use-toast';
import type {
  Patient,
  PatientCreateRequest,
  PatientUpdateRequest,
  PatientSearchParams,
  Gender,
  PatientStatus
} from '@/types/patient';

/**
 * Hook para gerenciamento de pacientes usando backend Spring Boot
 * Substituto do usePatients do Supabase
 */
export function usePatientsSpring() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { toast } = useToast();

  const fetchPatients = async (params?: PatientSearchParams) => {
    try {
      setLoading(true);
      const searchParams = {
        query: params?.query || '',
        type: params?.type || 'name',
        status: params?.status,
        page: params?.page || 0,
        size: params?.size || 50
      };

      const response = await patientService.search(searchParams);

      setPatients(response.content);
      setTotalCount(response.totalElements);
      setCurrentPage(response.number);
      setTotalPages(response.totalPages);
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Erro ao carregar pacientes",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const addPatient = async (patientData: PatientCreateRequest): Promise<Patient> => {
    try {
      const newPatient = await patientService.create(patientData);

      setPatients(prev => [newPatient, ...prev]);
      setTotalCount(prev => prev + 1);

      toast({
        title: "Sucesso",
        description: `Paciente ${newPatient.firstName} ${newPatient.lastName} cadastrado com código ${newPatient.patientCode}!`,
      });

      return newPatient;
    } catch (error: any) {
      console.error('Error adding patient:', error);
      const errorMessage = error.response?.data?.message || error.message;
      toast({
        title: "Erro ao cadastrar paciente",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePatient = async (id: string, updates: PatientUpdateRequest): Promise<Patient> => {
    try {
      const updatedPatient = await patientService.update(id, updates);

      setPatients(prev => prev.map(p => p.id === id ? updatedPatient : p));

      toast({
        title: "Sucesso",
        description: "Paciente atualizado com sucesso!",
      });

      return updatedPatient;
    } catch (error: any) {
      console.error('Error updating patient:', error);
      const errorMessage = error.response?.data?.message || error.message;
      toast({
        title: "Erro ao atualizar paciente",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deletePatient = async (id: string): Promise<void> => {
    try {
      await patientService.delete(id);

      setPatients(prev => prev.filter(p => p.id !== id));
      setTotalCount(prev => prev - 1);

      toast({
        title: "Sucesso",
        description: "Paciente removido com sucesso!",
      });
    } catch (error: any) {
      console.error('Error deleting patient:', error);
      const errorMessage = error.response?.data?.message || error.message;
      toast({
        title: "Erro ao remover paciente",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const searchPatients = async (query: string, type: 'name' | 'cpf' | 'cns' = 'name') => {
    await fetchPatients({ query, type });
  };

  const filterByStatus = async (status: PatientStatus) => {
    await fetchPatients({ status });
  };

  // Carregar pacientes ao montar o componente
  useEffect(() => {
    fetchPatients();
  }, []);

  return {
    patients,
    loading,
    totalCount,
    currentPage,
    totalPages,
    addPatient,
    updatePatient,
    deletePatient,
    refetch: fetchPatients,
    searchPatients,
    filterByStatus,
    fetchPatients
  };
}

// Compatibilidade com interface antiga
export const usePatients = usePatientsSpring;