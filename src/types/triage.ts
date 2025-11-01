/**
 * Triage Types - Épico B
 * Types matching backend DTOs for Manchester Triage Protocol
 */

// Manchester Color Classification
export type ManchesterColor = 'BLUE' | 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

// Visit Status
export type VisitStatus =
  | 'AWAITING_TRIAGE'      // Aguardando triagem
  | 'AWAITING_DOCTOR'      // Aguardando médico
  | 'IN_ATTENDANCE'        // Em atendimento
  | 'AWAITING_EXAM'        // Aguardando exame
  | 'COMPLETED'            // Finalizado
  | 'CANCELLED';           // Cancelado

/**
 * Vital Signs DTO
 * Matches backend VitalSignsDTO
 */
export interface VitalSigns {
  bloodPressure: string;           // PA (formato: "120/80")
  heartRate: number;               // FC (bpm)
  respiratoryRate?: number;        // FR (irpm) - opcional
  temperature?: number;            // Temperatura (°C) - opcional
  oxygenSaturation?: number;       // SpO2 (%) - opcional
  glasgowComaScale: number;        // Glasgow (3-15)
}

/**
 * Triage Register Request
 * Data sent to POST /api/v1/triage/visits/{visitId}
 */
export interface TriageRegisterRequest {
  vitalSigns: VitalSigns;
  triageColor: ManchesterColor;
  triageJustification: string;
}

/**
 * Triage Board Item DTO
 * Matches backend TriageBoardDTO
 */
export interface TriageBoardItem {
  visitId: string;                  // UUID
  patientName: string;              // Nome completo
  patientCode: string;              // PA-2025-XXXXXX
  triageColor: ManchesterColor | null;
  status: VisitStatus;
  entryTime: string;                // ISO 8601 timestamp (visitDate)
  triageTime: string | null;        // ISO 8601 timestamp (triageAt)
  waitingTimeMinutes: number;       // Tempo de espera em minutos
  sectorId?: string | null;
  sectorName?: string | null;
}

/**
 * Sector Assignment Request
 * Data sent to PUT /api/v1/triage/visits/{visitId}/sector
 */
export interface SectorAssignRequest {
  sectorId: string;                 // UUID do setor
}

/**
 * Manchester Color Display Info
 */
export interface ManchesterColorInfo {
  color: ManchesterColor;
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  priority: number;                  // 1 = highest (RED), 5 = lowest (BLUE)
  maxWaitTime: number;               // Tempo máximo em minutos
}

/**
 * Manchester Color Mapping
 * Reference: Sistema Manchester de Classificação de Risco
 */
export const MANCHESTER_COLORS: Record<ManchesterColor, ManchesterColorInfo> = {
  RED: {
    color: 'RED',
    label: 'Emergência',
    bgColor: 'bg-red-500',
    textColor: 'text-white',
    borderColor: 'border-red-600',
    priority: 1,
    maxWaitTime: 0  // Imediato
  },
  ORANGE: {
    color: 'ORANGE',
    label: 'Muito Urgente',
    bgColor: 'bg-orange-500',
    textColor: 'text-white',
    borderColor: 'border-orange-600',
    priority: 2,
    maxWaitTime: 10  // 10 minutos
  },
  YELLOW: {
    color: 'YELLOW',
    label: 'Urgente',
    bgColor: 'bg-yellow-400',
    textColor: 'text-gray-900',
    borderColor: 'border-yellow-500',
    priority: 3,
    maxWaitTime: 60  // 1 hora
  },
  GREEN: {
    color: 'GREEN',
    label: 'Pouco Urgente',
    bgColor: 'bg-green-500',
    textColor: 'text-white',
    borderColor: 'border-green-600',
    priority: 4,
    maxWaitTime: 120  // 2 horas
  },
  BLUE: {
    color: 'BLUE',
    label: 'Não Urgente',
    bgColor: 'bg-blue-500',
    textColor: 'text-white',
    borderColor: 'border-blue-600',
    priority: 5,
    maxWaitTime: 240  // 4 horas
  }
};

/**
 * Helper: Get Manchester color info
 */
export function getManchesterColorInfo(color: ManchesterColor): ManchesterColorInfo {
  return MANCHESTER_COLORS[color];
}

/**
 * Helper: Check if waiting time exceeds maximum
 */
export function isWaitingTimeExceeded(color: ManchesterColor, waitingMinutes: number): boolean {
  const info = MANCHESTER_COLORS[color];
  return waitingMinutes > info.maxWaitTime;
}

/**
 * Helper: Format waiting time
 */
export function formatWaitingTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}min`;
}

/**
 * Helper: Validate vital signs (frontend validation)
 */
export function validateVitalSigns(vs: VitalSigns): string[] {
  const errors: string[] = [];

  // Blood Pressure (obrigatório)
  if (!vs.bloodPressure || !vs.bloodPressure.match(/^\d{2,3}\/\d{2,3}$/)) {
    errors.push('Pressão arterial no formato inválido (ex: 120/80)');
  } else {
    const [sys, dia] = vs.bloodPressure.split('/').map(Number);
    if (sys < 50 || sys > 250) errors.push('PA sistólica deve estar entre 50-250 mmHg');
    if (dia < 30 || dia > 150) errors.push('PA diastólica deve estar entre 30-150 mmHg');
    if (dia >= sys) errors.push('PA diastólica deve ser menor que sistólica');
  }

  // Heart Rate (obrigatório)
  if (!vs.heartRate) {
    errors.push('Frequência cardíaca é obrigatória');
  } else if (vs.heartRate < 20 || vs.heartRate > 250) {
    errors.push('Frequência cardíaca deve estar entre 20-250 bpm');
  }

  // Glasgow (obrigatório - ENENHARIA.md linha 147)
  if (!vs.glasgowComaScale) {
    errors.push('Escala de Glasgow é obrigatória');
  } else if (vs.glasgowComaScale < 3 || vs.glasgowComaScale > 15) {
    errors.push('Glasgow deve estar entre 3-15');
  }

  // Respiratory Rate (opcional)
  if (vs.respiratoryRate !== undefined && (vs.respiratoryRate < 5 || vs.respiratoryRate > 60)) {
    errors.push('Frequência respiratória deve estar entre 5-60 irpm');
  }

  // Temperature (opcional)
  if (vs.temperature !== undefined && (vs.temperature < 32 || vs.temperature > 43)) {
    errors.push('Temperatura deve estar entre 32-43°C');
  }

  // Oxygen Saturation (opcional)
  if (vs.oxygenSaturation !== undefined && (vs.oxygenSaturation < 50 || vs.oxygenSaturation > 100)) {
    errors.push('SpO2 deve estar entre 50-100%');
  }

  return errors;
}
