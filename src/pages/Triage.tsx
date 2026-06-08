/**
 * Triage Page - Épico B
 * Main page for Manchester Triage Protocol
 *
 * Layout:
 * - Top: TriageQueue (patients awaiting triage)
 * - Bottom: TriageBoard (5-column Manchester board)
 * - Modal: TriageForm (when clicking "Iniciar Triagem")
 */

import { useState, useEffect, useCallback } from 'react';
import { TriageQueue } from '@/components/triage/TriageQueue';
import { TriageBoard } from '@/components/triage/TriageBoard';
import { TriageForm } from '@/components/triage/TriageForm';
import { EmergencyBypassDialog } from '@/components/attendance/EmergencyBypassDialog';
import { triageService } from '@/services/triageService';
import { TriageBoardItem } from '@/types/triage';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { RefreshCw, AlertCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCapabilities } from '@/auth/useCapabilities';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function Triage() {
  const [patients, setPatients] = useState<TriageBoardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const capabilities = useCapabilities();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [manualAutoRefreshPause, setManualAutoRefreshPause] = useState(false);

  // Triage Form State
  const [isTriageFormOpen, setIsTriageFormOpen] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>('');

  // Load triage board
  const loadTriageBoard = useCallback(async () => {
    setIsRefreshing(true);
    try {
      setError(null);
      const data = await triageService.getTriageBoard();
      setPatients(data);
    } catch (err: any) {
      console.error('Error loading triage board:', err);
      setError(err.message || 'Erro ao carregar painel de triagem');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadTriageBoard();
  }, [loadTriageBoard]);

  // Handle start triage
  const handleStartTriage = (visitId: string, patientName: string) => {
    setSelectedVisitId(visitId);
    setSelectedPatientName(patientName);
    setIsTriageFormOpen(true);
  };

  // Handle triage success
  const handleTriageSuccess = () => {
    setIsTriageFormOpen(false);
    setSelectedVisitId(null);
    setSelectedPatientName('');
    void loadTriageBoard(); // Refresh board
    toast({
      title: 'Triagem registrada',
      description: 'Paciente atualizado para aguardando atendimento médico.',
    });
  };

  // Handle triage cancel
  const handleTriageCancel = () => {
    setIsTriageFormOpen(false);
    setSelectedVisitId(null);
    setSelectedPatientName('');
  };


  // Manual refresh
  const handleManualRefresh = () => {
    setIsLoading(true);
    loadTriageBoard();
  };
  const modalPause = isTriageFormOpen;
  const autoRefreshEnabled = !manualAutoRefreshPause && !modalPause;
  const isPollingPaused = !autoRefreshEnabled;

  if (authLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <RefreshCw className="h-12 w-12 mx-auto animate-spin text-gray-400" />
          <p className="mt-4 text-gray-600">Carregando contexto...</p>
        </div>
      </div>
    );
  }

  if (!user?.staffId) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="warning" className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Para acessar o módulo de triagem é necessário vincular o usuário a um profissional da equipe.
            Cadastre o usuário em <strong>Equipe</strong> e associe-o à área apropriada antes de prosseguir.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading && patients.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <RefreshCw className="h-12 w-12 mx-auto animate-spin text-gray-400" />
          <p className="mt-4 text-gray-600">Carregando painel de triagem...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Triagem Manchester</h1>
          <p className="text-gray-600 mt-1">
            Classificação de risco e gestão de atendimentos
          </p>
        </div>
        <Button onClick={handleManualRefresh} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${(isLoading || isRefreshing) ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Triage Queue - Patients awaiting triage */}
      <TriageQueue
        patients={patients}
        onStartTriage={handleStartTriage}
        canStartTriage={capabilities.canCreateTriage}
      />

      {/* Triage Board - 5 Manchester columns */}
      <TriageBoard
        patients={patients}
        autoRefresh={autoRefreshEnabled}
        onRefresh={loadTriageBoard}
        canStartAttendance={capabilities.canStartAttendance}
        onStartAttendance={(visitId, patientName) => {
          void (async () => {
            try {
              await triageService.startAttendance(visitId);
              await loadTriageBoard();
              toast({
                title: 'Atendimento iniciado',
                description: `${patientName} está em atendimento.`,
              });
              navigate(`/medical-records?visitId=${visitId}`);
            } catch (err: any) {
              toast({
                title: 'Não foi possível iniciar atendimento',
                description: err?.message || 'Erro ao iniciar atendimento.',
                variant: 'destructive',
              });
            }
          })();
        }}
        isRefreshing={isRefreshing}
        isPaused={isPollingPaused}
        isManualPause={manualAutoRefreshPause}
        disableToggle={modalPause}
        onToggleAutoRefresh={() => setManualAutoRefreshPause((prev) => !prev)}
      />

      {/* Triage Form Modal */}
      <Dialog open={isTriageFormOpen} onOpenChange={setIsTriageFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogTitle className="sr-only">
            Triagem Manchester - {selectedPatientName}
          </DialogTitle>
          {selectedVisitId && (
            <TriageForm
              visitId={selectedVisitId}
              patientName={selectedPatientName}
              onSuccess={handleTriageSuccess}
              onCancel={handleTriageCancel}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
