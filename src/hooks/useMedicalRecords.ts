import { useEffect, useState } from "react";
import { medicalRecordService } from "@/services/medicalRecordService";
import type { MedicalRecordResponse, MedicalRecordRequest } from "@/types/medicalRecord";

export interface MedicalRecordItem {
  id: string;
  record_type: string;
  chief_complaint?: string;
  diagnosis?: string;
  notes?: string;
  created_at: string;
  vital_signs?: Record<string, unknown>;
  triage_payload?: Record<string, unknown>;
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    patient_code?: string;
  };
  doctor?: {
    id: string;
    first_name: string;
    last_name: string;
    staff_code?: string;
  };
}

export function useMedicalRecords(options?: { visitId?: string }) {
  const [records, setRecords] = useState<MedicalRecordItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      if (!options?.visitId) {
        setRecords([]);
        return;
      }
      const data = await medicalRecordService.findByVisit(options.visitId);
      setRecords(data.map(mapRecord));
    } catch (error) {
      console.error("Erro ao carregar prontuários:", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [options?.visitId]);

  const createRecord = async (payload: MedicalRecordRequest) => {
    const created = await medicalRecordService.create(payload);
    await load();
    return created;
  };

  return {
    records,
    loading,
    createRecord,
    refetch: load,
  };
}

function mapRecord(record: MedicalRecordResponse): MedicalRecordItem {
  const patientName = record.patientName || '';
  const [firstName, ...rest] = patientName.trim().split(' ');
  const lastName = rest.join(' ');
  const doctorName = record.doctorName || '';
  const [doctorFirst, ...doctorRest] = doctorName.trim().split(' ');
  const doctorLast = doctorRest.join(' ');

  return {
    id: record.id,
    record_type: record.recordType,
    chief_complaint: record.chiefComplaint,
    diagnosis: record.diagnosis,
    notes: record.notes,
    created_at: record.createdAt,
    vital_signs: record.vitalSigns,
    triage_payload: record.triagePayload,
    patient: {
      id: record.patientId,
      first_name: firstName || patientName,
      last_name: lastName || '',
      patient_code: '',
    },
    doctor: {
      id: record.doctorId,
      first_name: doctorFirst || doctorName,
      last_name: doctorLast || '',
      staff_code: record.doctorRegistration,
    },
  };
}
