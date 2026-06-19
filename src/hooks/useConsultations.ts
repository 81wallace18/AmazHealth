import { useEffect, useState } from "react";
import { triageService } from "@/services/triageService";
import type { ManchesterColor, TriageBoardItem } from "@/types/triage";

export interface Consultation {
  id: string;
  patientCode: string;
  patientName: string;
  visit_date: string;
  status: "WAITING_DOCTOR" | "IN_PROGRESS";
  triageColor: ManchesterColor | null;
  waitingTimeMinutes: number;
  areaName?: string | null;
  serviceName?: string | null;
}

export function useConsultations() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const board = await triageService.getTriageBoard();
      setConsultations(
        board
          .filter((item) => item.status === "WAITING_DOCTOR" || item.status === "IN_PROGRESS")
          .map(mapBoardToConsultation)
      );
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

  const startAttendance = async (id: string) => {
    await triageService.startAttendance(id);
    await load();
  };

  return {
    consultations,
    loading,
    startAttendance,
    refetch: load,
  };
}

function mapBoardToConsultation(item: TriageBoardItem): Consultation {
  return {
    id: item.visitId,
    patientCode: item.patientCode,
    patientName: item.patientName,
    visit_date: item.entryTime,
    status: item.status === "IN_PROGRESS" ? "IN_PROGRESS" : "WAITING_DOCTOR",
    triageColor: item.triageColor,
    waitingTimeMinutes: item.waitingTimeMinutes,
    areaName: item.areaName,
    serviceName: item.serviceName,
  };
}
