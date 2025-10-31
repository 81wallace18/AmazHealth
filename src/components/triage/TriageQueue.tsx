/**
 * TriageQueue Component - Épico B
 * Displays patients awaiting triage (status = AWAITING_TRIAGE)
 *
 * Requirements:
 * - Show patients waiting for triage
 * - Button to start triage (opens TriageForm)
 * - Display waiting time
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TriageBoardItem, formatWaitingTime } from '@/types/triage';
import { Clock, User, ClipboardList } from 'lucide-react';

interface TriageQueueProps {
  patients: TriageBoardItem[];
  onStartTriage: (visitId: string, patientName: string) => void;
}

export function TriageQueue({ patients, onStartTriage }: TriageQueueProps) {
  // Filter only patients awaiting triage
  const waitingPatients = patients.filter((p) => p.status === 'AWAITING_TRIAGE');

  if (waitingPatients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Fila de Triagem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Nenhum paciente aguardando triagem</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Fila de Triagem
          <Badge variant="secondary" className="ml-2">
            {waitingPatients.length} {waitingPatients.length === 1 ? 'paciente' : 'pacientes'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {waitingPatients.map((patient) => (
            <div
              key={patient.visitId}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <h4 className="font-semibold">{patient.patientName}</h4>
                    <p className="text-sm text-gray-500">
                      Código: {patient.patientCode}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Waiting Time */}
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Aguardando:</span>
                  </div>
                  <div
                    className={`text-lg font-semibold ${
                      patient.waitingTimeMinutes > 15
                        ? 'text-orange-600'
                        : 'text-gray-700'
                    }`}
                  >
                    {formatWaitingTime(patient.waitingTimeMinutes)}
                  </div>
                </div>

                {/* Start Triage Button */}
                <Button
                  onClick={() => onStartTriage(patient.visitId, patient.patientName)}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  Iniciar Triagem
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Warning for long waits */}
        {waitingPatients.some((p) => p.waitingTimeMinutes > 15) && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              <strong>Atenção:</strong> Há pacientes aguardando há mais de 15 minutos.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
