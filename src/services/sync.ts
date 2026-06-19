/**
 * Tipos compartilhados entre apiClient (frontend) e o sidecar de sync (Rust).
 * Devem espelhar SyncOperation enums no backend e em src-tauri/src/sync/types.rs.
 */

export type OutboxStatus = 'PENDING' | 'SENT' | 'ACKED' | 'CONFLICT' | 'REJECTED';

export type OperationType =
  | 'createVisit'
  | 'recordTriage'
  | 'registerEvolution'
  | 'createPrescription'
  | 'dispenseMedication'
  | 'emergencyBypass'
  | 'finalizeVisit';

export const OPERATION_TYPES: readonly OperationType[] = [
  'createVisit',
  'recordTriage',
  'registerEvolution',
  'createPrescription',
  'dispenseMedication',
  'emergencyBypass',
  'finalizeVisit',
] as const;

export interface OutboxEntry {
  client_uuid: string;
  operation_type: OperationType | string;
  payload: unknown;
  client_created_at: number;
  status: OutboxStatus;
  attempts: number;
  last_error: string | null;
  next_retry_at: number | null;
  persisted_id: string | null;
  acked_at: number | null;
}

export interface SyncEngineState {
  running: boolean;
  last_run_at: number | null;
  last_error: string | null;
  pending_count: number;
}

export interface SyncReport {
  attempted: number;
  acked: number;
  conflicted: number;
  rejected: number;
  failed: number;
}
