import { useEffect, useState } from "react";
import { triageService } from "@/services/triageService";
import type { TriageBoardItem } from "@/types/triage";

export interface Consultation {
  id: string;
  visit_code?: string;
  visit_type?: string;
  visit_date: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  visit_status?: TriageBoardItem["status"];
  chief_complaint?: string;
  patients?: {
    id: string;
    first_name: string;
    last_name: string;
    patient_code?: string;
  };
  staff?: {
    id: string;
    first_name: string;
    last_name: string;
    specialization?: string;
  };
}

export function useConsultations() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const board = await triageService.getTriageBoard();
      setConsultations(board.map(mapBoardToConsultation));
    } catch (error) {
      console.error("Erro ao carregar consultas:", error);
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateConsultationStatus = async (_id: string, _status: Consultation["status"]) => {
    return;
  };

  return {
    consultations,
    loading,
    updateConsultationStatus,
    refetch: load,
  };
}

function mapBoardToConsultation(item: TriageBoardItem): Consultation {
  const [firstName, ...rest] = (item.patientName || '').trim().split(' ');
  const lastName = rest.join(' ');

  const status = item.status === 'IN_PROGRESS'
    ? 'in_progress'
    : item.status === 'WAITING_DOCTOR' || item.status === 'CREATED'
    ? 'scheduled'
    : item.status === 'CANCELLED'
    ? 'cancelled'
    : 'scheduled';

  const visitType = 'emergency';

  return {
    id: item.visitId,
    visit_code: item.patientCode,
    visit_type: visitType,
    visit_date: item.entryTime,
    status,
    visit_status: item.status,
    patients: {
      id: item.visitId,
      first_name: firstName || item.patientName,
      last_name: lastName || '',
      patient_code: item.patientCode,
    },
    staff: {
      id: '',
      first_name: '',
      last_name: '',
      specialization: item.serviceName || '',
    },
    chief_complaint: undefined,
  };
}
