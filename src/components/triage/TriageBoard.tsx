/**
 * TriageBoard Component - Épico B
 * Manchester Triage Board with 5 color columns
 *
 * Requirements (ENENHARIA.md linha 156):
 * - Lista por prioridade/tempo de espera
 * - Filtros por setor/cor
 * - Atualização sem refresh (auto-refresh a cada 30s)
 */

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TriageBoardItem,
  ManchesterColor,
  MANCHESTER_COLORS,
  formatWaitingTime,
  isWaitingTimeExceeded,
} from '@/types/triage';
import { Clock, AlertTriangle, MapPin, RefreshCw } from 'lucide-react';

interface TriageBoardProps {
  patients: TriageBoardItem[];
  autoRefresh?: boolean;
  onRefresh?: () => void;
  onAssignSector?: (visitId: string, patientName: string) => void;
  isRefreshing?: boolean;
  isPaused?: boolean;
  isManualPause?: boolean;
  disableToggle?: boolean;
  onToggleAutoRefresh?: () => void;
}

export function TriageBoard({
  patients,
  autoRefresh = true,
  onRefresh,
  onAssignSector,
  isRefreshing = false,
  isPaused = false,
  isManualPause = false,
  disableToggle = false,
  onToggleAutoRefresh,
}: TriageBoardProps) {
  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh || !onRefresh) return;

    const interval = setInterval(() => {
      onRefresh();
    }, 30000); // 30s

    return () => clearInterval(interval);
  }, [autoRefresh, onRefresh]);

  // Group patients by Manchester color
  const patientsByColor: Record<ManchesterColor, TriageBoardItem[]> = {
    RED: [],
    ORANGE: [],
    YELLOW: [],
    GREEN: [],
    BLUE: [],
  };

  // Filter only triaged patients (AWAITING_DOCTOR or IN_ATTENDANCE)
  const triagedPatients = patients.filter(
    (p) => p.triageColor && (p.status === 'AWAITING_DOCTOR' || p.status === 'IN_ATTENDANCE')
  );

  triagedPatients.forEach((patient) => {
    if (patient.triageColor) {
      patientsByColor[patient.triageColor].push(patient);
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Painel de Triagem Manchester</h2>
          <Badge variant="outline" className="text-sm">
            {triagedPatients.length} {triagedPatients.length === 1 ? 'paciente' : 'pacientes'} no painel
          </Badge>
        </div>
        {onToggleAutoRefresh && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleAutoRefresh}
              disabled={disableToggle && !isManualPause}
            >
              {isPaused ? 'Retomar Atualização' : 'Pausar Atualização'}
            </Button>
            {isPaused && (
              <Badge variant="secondary" className="text-xs">
                {isManualPause ? 'Pausado manualmente' : 'Pausado temporariamente'}
              </Badge>
            )}
          </div>
        )}
      </div>

      {triagedPatients.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-gray-500">
            <p>Nenhum paciente triado no momento</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Render columns in priority order: RED, ORANGE, YELLOW, GREEN, BLUE */}
          {(['RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE'] as ManchesterColor[]).map((color) => {
            const colorInfo = MANCHESTER_COLORS[color];
            const columnPatients = patientsByColor[color];

            return (
              <Card key={color} className={`border-2 ${colorInfo.borderColor}`}>
                <CardHeader className={`${colorInfo.bgColor} ${colorInfo.textColor} p-3`}>
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span>{colorInfo.label}</span>
                    <Badge variant="secondary" className="bg-white text-gray-800">
                      {columnPatients.length}
                    </Badge>
                  </CardTitle>
                  <p className="text-xs opacity-90">
                    Máx: {colorInfo.maxWaitTime === 0 ? 'Imediato' : `${colorInfo.maxWaitTime}min`}
                  </p>
                </CardHeader>
                <CardContent className="p-3 space-y-2 min-h-[200px]">
                  {columnPatients.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">
                      Nenhum paciente
                    </p>
                  ) : (
                    columnPatients.map((patient) => {
                      const exceeded = isWaitingTimeExceeded(color, patient.waitingTimeMinutes);

                      return (
                        <div
                          key={patient.visitId}
                          className={`p-3 rounded-lg border ${
                            exceeded
                              ? 'bg-red-50 border-red-300'
                              : patient.status === 'IN_ATTENDANCE'
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          {/* Patient Info */}
                          <div className="space-y-1">
                            <h4 className="font-semibold text-sm">{patient.patientName}</h4>
                            <p className="text-xs text-gray-500">{patient.patientCode}</p>
                          </div>

                      {/* Sector */}
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                        <MapPin className="h-3 w-3" />
                        <span>{patient.sectorName ?? 'Setor não definido'}</span>
                      </div>

                      {/* Status Badge */}
                      <div className="mt-2">
                        {patient.status === 'IN_ATTENDANCE' ? (
                          <Badge variant="default" className="text-xs">
                            Em Atendimento
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Aguardando Médico
                          </Badge>
                        )}
                      </div>

                      {/* Waiting Time */}
                      <div className="mt-2 flex items-center gap-1 text-xs">
                        <Clock className="h-3 w-3" />
                        <span className={exceeded ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                          {formatWaitingTime(patient.waitingTimeMinutes)}
                        </span>
                        {exceeded && <AlertTriangle className="h-3 w-3 text-red-600 ml-1" />}
                      </div>

                      {/* Exceeded Warning */}
                      {exceeded && (
                        <p className="text-xs text-red-600 mt-1 font-medium">
                          Tempo excedido!
                        </p>
                      )}

                      {onAssignSector && patient.status === 'AWAITING_DOCTOR' && (
                        <div className="mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAssignSector(patient.visitId, patient.patientName)}
                          >
                            Definir setor
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                    })
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Auto-refresh indicator */}
      {onRefresh && (
        <p className="text-sm text-gray-500 text-center flex items-center justify-center gap-2">
          {isRefreshing && <RefreshCw className="h-3 w-3 animate-spin" aria-hidden="true" />}
          {isPaused
            ? isManualPause
              ? 'Atualização pausada manualmente'
              : 'Atualização pausada enquanto há janelas abertas'
            : 'Atualização automática a cada 30 segundos'}
        </p>
      )}
    </div>
  );
}
