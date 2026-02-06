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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ManchesterColor, MANCHESTER_COLORS } from '@/types/triage';

export default function Triage() {
  const [patients, setPatients] = useState<TriageBoardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isAssignSectorOpen, setIsAssignSectorOpen] = useState(false);
  const [assigningVisitId, setAssigningVisitId] = useState<string | null>(null);
  const [assigningPatientName, setAssigningPatientName] = useState('');
  const [selectedSectorId, setSelectedSectorId] = useState('');
  const [sectorReason, setSectorReason] = useState('');
  const [isAssigningSector, setIsAssigningSector] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [manualAutoRefreshPause, setManualAutoRefreshPause] = useState(false);

  // Reclassify Dialog State
  const [isReclassifyOpen, setIsReclassifyOpen] = useState(false);
  const [reclassifyVisitId, setReclassifyVisitId] = useState<string | null>(null);
  const [reclassifyPatientName, setReclassifyPatientName] = useState('');
  const [reclassifyColor, setReclassifyColor] = useState<ManchesterColor>('GREEN');
  const [reclassifyReason, setReclassifyReason] = useState('');
  const [reclassifyError, setReclassifyError] = useState<string | null>(null);
  const [isReclassifying, setIsReclassifying] = useState(false);

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
        const data = await sectorService.list('AREA');
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
    setSectorReason('');
    setAssignError(null);
    setIsAssignSectorOpen(true);
  };

  const handleAssignDialogChange = (open: boolean) => {
    setIsAssignSectorOpen(open);
    if (!open) {
      setAssigningVisitId(null);
      setAssigningPatientName('');
      setSelectedSectorId('');
      setSectorReason('');
      setAssignError(null);
      setIsAssigningSector(false);
    }
  };

  const handleAssignSector = async () => {
    if (!assigningVisitId || !selectedSectorId) {
      setAssignError('Selecione uma área.');
      return;
    }

    if (!sectorReason || sectorReason.trim().length < 5) {
      setAssignError('Informe o motivo da mudança de área (mínimo 5 caracteres).');
      return;
    }

    try {
      setIsAssigningSector(true);
      await triageService.assignArea(assigningVisitId, selectedSectorId, sectorReason.trim());
      await loadTriageBoard();
      const sector = sectors.find((item) => item.id === selectedSectorId);
      setAssignError(null);
      handleAssignDialogChange(false);
      toast({
        title: 'Área definida',
        description: sector
          ? `${assigningPatientName} foi encaminhado para ${sector.name}.`
          : 'Área atualizada com sucesso.',
      });
    } catch (err: any) {
      const message = err.message || 'Erro ao atribuir área';
      setAssignError(message);
      toast({
        title: 'Falha ao definir área',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsAssigningSector(false);
    }
  };

  const handleOpenReclassify = (visitId: string, patientName: string) => {
    setReclassifyVisitId(visitId);
    setReclassifyPatientName(patientName);
    setReclassifyColor('GREEN');
    setReclassifyReason('');
    setReclassifyError(null);
    setIsReclassifyOpen(true);
  };

  const handleReclassifyDialogChange = (open: boolean) => {
    setIsReclassifyOpen(open);
    if (!open) {
      setReclassifyVisitId(null);
      setReclassifyPatientName('');
      setReclassifyReason('');
      setReclassifyError(null);
      setIsReclassifying(false);
    }
  };

  const handleReclassify = async () => {
    if (!reclassifyVisitId) return;
    if (!reclassifyReason || reclassifyReason.trim().length < 5) {
      setReclassifyError('Informe o motivo da reclassificação (mínimo 5 caracteres).');
      return;
    }

    try {
      setIsReclassifying(true);
      await triageService.reclassify(reclassifyVisitId, {
        triageColor: reclassifyColor,
        reason: reclassifyReason.trim(),
      });
      await loadTriageBoard();
      handleReclassifyDialogChange(false);
      toast({
        title: 'Reclassificação registrada',
        description: `${reclassifyPatientName} foi reclassificado para ${MANCHESTER_COLORS[reclassifyColor].label}.`,
      });
    } catch (err: any) {
      const message = err?.message || 'Erro ao reclassificar triagem';
      setReclassifyError(message);
      toast({
        title: 'Falha ao reclassificar',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsReclassifying(false);
    }
  };

  // Manual refresh
  const handleManualRefresh = () => {
    setIsLoading(true);
    loadTriageBoard();
  };
  const modalPause = isTriageFormOpen || isAssignSectorOpen || isReclassifyOpen;
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
        <Alert variant="default" className="max-w-2xl mx-auto border-yellow-300 bg-yellow-50 text-yellow-900">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Para acessar o módulo de triagem é necessário vincular o usuário a um profissional da equipe.
            Cadastre o usuário em <strong>Staff</strong> e associe-o à área apropriada antes de prosseguir.
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
        canStartTriage={user?.roles?.includes('NURSE') || user?.roles?.includes('ADMIN')}
      />

      {/* Triage Board - 5 Manchester columns */}
      <TriageBoard
        patients={patients}
        autoRefresh={autoRefreshEnabled}
        onRefresh={loadTriageBoard}
        canAssignSector={user?.roles?.includes('DOCTOR') || user?.roles?.includes('ADMIN')}
        canStartAttendance={user?.roles?.includes('DOCTOR')}
        canReclassify={user?.roles?.includes('NURSE') || user?.roles?.includes('ADMIN')}
        onReclassify={handleOpenReclassify}
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
        onAssignSector={handleOpenAssignSector}
        isPaused={isPollingPaused}
        isManualPause={manualAutoRefreshPause}
        disableToggle={modalPause}
        onToggleAutoRefresh={() => setManualAutoRefreshPause((prev) => !prev)}
      />

      <Dialog open={isReclassifyOpen} onOpenChange={handleReclassifyDialogChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reclassificar triagem</DialogTitle>
            <DialogDescription>
              Atualize a cor Manchester para <strong>{reclassifyPatientName}</strong> e informe o motivo.
            </DialogDescription>
          </DialogHeader>

          {reclassifyError && (
            <Alert variant="destructive" className="mb-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{reclassifyError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Nova cor</Label>
            <Select
              value={reclassifyColor}
              onValueChange={(value) => {
                setReclassifyColor(value as ManchesterColor);
                setReclassifyError(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {(['RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE'] as ManchesterColor[]).map((color) => (
                  <SelectItem key={color} value={color}>
                    {MANCHESTER_COLORS[color].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reclassify-reason">Motivo *</Label>
            <Textarea
              id="reclassify-reason"
              value={reclassifyReason}
              onChange={(event) => {
                setReclassifyReason(event.target.value);
                setReclassifyError(null);
              }}
              rows={4}
              placeholder="Descreva o motivo clínico/operacional da reclassificação."
            />
            <p className="text-xs text-muted-foreground">Obrigatório — mínimo 5 caracteres.</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleReclassifyDialogChange(false)} disabled={isReclassifying}>
              Cancelar
            </Button>
            <Button onClick={handleReclassify} disabled={isReclassifying}>
              {isReclassifying ? 'Salvando...' : 'Reclassificar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignSectorOpen} onOpenChange={handleAssignDialogChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
          <DialogTitle>Definir área</DialogTitle>
            <DialogDescription>
              Selecione a área de destino para <strong>{assigningPatientName}</strong>.
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
              Nenhuma área disponível nesta organização.
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
                <SelectValue placeholder="Selecione a área" />
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

          <div className="space-y-2">
            <Label htmlFor="sector-reason">Motivo *</Label>
            <Textarea
              id="sector-reason"
              value={sectorReason}
              onChange={(event) => {
                setSectorReason(event.target.value);
                setAssignError(null);
              }}
              rows={4}
              placeholder="Explique por que o paciente está sendo direcionado para esta área."
            />
            <p className="text-xs text-muted-foreground">
              Obrigatório — mínimo 5 caracteres.
            </p>
          </div>

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
