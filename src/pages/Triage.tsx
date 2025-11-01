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
import { triageService } from '@/services/triageService';
import { sectorService } from '@/services/sectorService';
import { TriageBoardItem } from '@/types/triage';
import type { Sector } from '@/types/sector';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function Triage() {
  const [patients, setPatients] = useState<TriageBoardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const { toast } = useToast();

  const [isAssignSectorOpen, setIsAssignSectorOpen] = useState(false);
  const [assigningVisitId, setAssigningVisitId] = useState<string | null>(null);
  const [assigningPatientName, setAssigningPatientName] = useState('');
  const [selectedSectorId, setSelectedSectorId] = useState('');
  const [isAssigningSector, setIsAssigningSector] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const data = await sectorService.list();
        setSectors(data);
      } catch (err) {
        console.error('Error loading sectors:', err);
      }
    };

    if (!authLoading && user) {
      fetchSectors();
    }
  }, [authLoading, user]);

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

  const handleOpenAssignSector = (visitId: string, patientName: string) => {
    setAssigningVisitId(visitId);
    setAssigningPatientName(patientName);
    setSelectedSectorId('');
    setAssignError(null);
    setIsAssignSectorOpen(true);
  };

  const handleAssignDialogChange = (open: boolean) => {
    setIsAssignSectorOpen(open);
    if (!open) {
      setAssigningVisitId(null);
      setAssigningPatientName('');
      setSelectedSectorId('');
      setAssignError(null);
      setIsAssigningSector(false);
    }
  };

  const handleAssignSector = async () => {
    if (!assigningVisitId || !selectedSectorId) {
      setAssignError('Selecione um setor.');
      return;
    }

    try {
      setIsAssigningSector(true);
      await triageService.assignSector(assigningVisitId, { sectorId: selectedSectorId });
      await loadTriageBoard();
      const sector = sectors.find((item) => item.id === selectedSectorId);
      setAssignError(null);
      handleAssignDialogChange(false);
      toast({
        title: 'Setor definido',
        description: sector
          ? `${assigningPatientName} foi encaminhado para ${sector.name}.`
          : 'Setor atualizado com sucesso.',
      });
    } catch (err: any) {
      const message = err.message || 'Erro ao atribuir setor';
      setAssignError(message);
      toast({
        title: 'Falha ao definir setor',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsAssigningSector(false);
    }
  };

  // Manual refresh
  const handleManualRefresh = () => {
    setIsLoading(true);
    loadTriageBoard();
  };

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
            Cadastre o usuário em <strong>Staff</strong> e associe-o ao setor apropriado antes de prosseguir.
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
      <TriageQueue patients={patients} onStartTriage={handleStartTriage} />

      {/* Triage Board - 5 Manchester columns */}
      <TriageBoard
        patients={patients}
        autoRefresh={true}
        onRefresh={loadTriageBoard}
        isRefreshing={isRefreshing}
        onAssignSector={handleOpenAssignSector}
      />

      <Dialog open={isAssignSectorOpen} onOpenChange={handleAssignDialogChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Definir setor</DialogTitle>
            <DialogDescription>
              Selecione o setor de destino para <strong>{assigningPatientName}</strong>.
            </DialogDescription>
          </DialogHeader>

          {assignError && (
            <Alert variant="destructive" className="mb-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{assignError}</AlertDescription>
            </Alert>
          )}

          {sectors.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum setor disponível nesta organização.
            </p>
          ) : (
            <Select
              value={selectedSectorId}
              onValueChange={(value) => {
                setSelectedSectorId(value);
                setAssignError(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o setor" />
              </SelectTrigger>
              <SelectContent>
                {sectors.map((sector) => (
                  <SelectItem key={sector.id} value={sector.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{sector.name}</span>
                      <span className="text-xs text-muted-foreground">{sector.type}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleAssignDialogChange(false)}
              disabled={isAssigningSector}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAssignSector}
              disabled={isAssigningSector || sectors.length === 0 || !selectedSectorId}
            >
              {isAssigningSector ? 'Salvando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Triage Form Modal */}
      <Dialog open={isTriageFormOpen} onOpenChange={setIsTriageFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
