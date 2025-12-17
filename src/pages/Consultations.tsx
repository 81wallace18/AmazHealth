import { useState, useEffect } from 'react';
import { Stethoscope, Clock, MapPin, User, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MedicalRecordHistory } from '@/components/medical-records/MedicalRecordHistory';
import { MedicalRecordForm } from '@/components/medical-records/MedicalRecordForm';
import { AttendanceOutcomeForm } from '@/components/medical-records/AttendanceOutcomeForm';
import { triageService } from '@/services/triageService';
import attendanceService, { type Attendance } from '@/services/attendanceService';
import type { TriageBoardItem, ManchesterColor } from '@/types/triage';
import { getManchesterColorInfo, formatWaitingTime } from '@/types/triage';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export default function Consultations() {
  const [patients, setPatients] = useState<TriageBoardItem[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<TriageBoardItem | null>(null);
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMedicalRecordForm, setShowMedicalRecordForm] = useState(false);
  const [showOutcomeForm, setShowOutcomeForm] = useState(false);
  const { user, loading: authLoading } = useAuth();

  // Carregar fila de pacientes
  useEffect(() => {
    loadPatients();
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadPatients, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPatients = async () => {
    try {
      const board = await triageService.getTriageBoard();

      // Filtrar apenas pacientes aguardando atendimento ou em atendimento
      const filtered = board.filter(
        p => p.status === 'AWAITING_DOCTOR' || p.status === 'IN_ATTENDANCE'
      );

      // Ordenar por prioridade (cor Manchester) e tempo de espera
      filtered.sort((a, b) => {
        // Prioridade por cor
        const colorA = a.triageColor ? getManchesterColorInfo(a.triageColor).priority : 999;
        const colorB = b.triageColor ? getManchesterColorInfo(b.triageColor).priority : 999;

        if (colorA !== colorB) {
          return colorA - colorB;
        }

        // Se mesma prioridade, por tempo de espera
        return b.waitingTimeMinutes - a.waitingTimeMinutes;
      });

      setPatients(filtered);
    } catch (error) {
      console.error('Erro ao carregar fila:', error);
      toast.error('Erro ao carregar fila de atendimento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartAttendance = async (patient: TriageBoardItem) => {
    setSelectedPatient(patient);

    try {
      await triageService.startAttendance(patient.visitId);

      // Buscar o attendance pelo visitId
      const found = await attendanceService.findByVisitId(patient.visitId);

      if (!found) {
        toast.error('Atendimento não encontrado para esta visita');
        console.error('Attendance não encontrado para visitId:', patient.visitId);
        setSelectedPatient(null);
        return;
      }

      setAttendance(found);
    } catch (error) {
      console.error('Erro ao buscar atendimento:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao iniciar/buscar dados do atendimento');
      setSelectedPatient(null);
    }
  };

  const handleCloseDialog = () => {
    setSelectedPatient(null);
    setAttendance(null);
    setShowMedicalRecordForm(false);
  };

  const getManchesterBadge = (color: ManchesterColor | null) => {
    if (!color) return null;

    const info = getManchesterColorInfo(color);
    return (
      <Badge className={cn(info.bgColor, info.textColor, "font-semibold")}>
        {info.label}
      </Badge>
    );
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'AWAITING_DOCTOR': 'Aguardando Atendimento',
      'IN_ATTENDANCE': 'Em Atendimento',
    };
    return labels[status] || status;
  };

  if (authLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Carregando contexto do usuário...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user?.staffId || !user.roles.includes('DOCTOR')) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Consultas indisponíveis</CardTitle>
            <CardDescription>
              Para acessar o módulo de consultas é necessário estar vinculado a um profissional médico.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                Cadastre um profissional com papel <strong>DOCTOR</strong> em <strong>Equipe Clínica</strong> e,
                em seguida, vincule o usuário a esse profissional em <strong>Usuários &amp; Acessos</strong>.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Carregando fila de atendimento...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Stethoscope className="h-8 w-8" />
          Consultas
        </h1>
        <p className="text-muted-foreground mt-1">
          Fila de atendimento - {patients.length} paciente(s)
        </p>
      </div>

      {/* Fila de Pacientes */}
      {patients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Stethoscope className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhum paciente aguardando atendimento no momento
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {patients.map((patient) => (
            <Card
              key={patient.visitId}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                patient.status === 'IN_ATTENDANCE' && "border-primary"
              )}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{patient.patientName}</CardTitle>
                    <CardDescription className="mt-1">
                      {patient.patientCode}
                    </CardDescription>
                  </div>
                  {patient.triageColor && getManchesterBadge(patient.triageColor)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Aguardando: {formatWaitingTime(patient.waitingTimeMinutes)}</span>
                </div>

                {patient.sectorName && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{patient.sectorName}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{getStatusLabel(patient.status)}</span>
                </div>

                <Button
                  onClick={() => handleStartAttendance(patient)}
                  className="w-full mt-2"
                  variant={patient.status === 'IN_ATTENDANCE' ? 'secondary' : 'default'}
                >
                  {patient.status === 'IN_ATTENDANCE' ? 'Continuar Atendimento' : 'Iniciar Atendimento'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de Atendimento */}
      <Dialog open={!!selectedPatient} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Atendimento - {selectedPatient?.patientName}
              {selectedPatient?.triageColor && (
                <span className="ml-2">
                  {getManchesterBadge(selectedPatient.triageColor)}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedPatient?.patientCode}
            </DialogDescription>
          </DialogHeader>

          {attendance && attendance.visitId ? (
            <Tabs defaultValue="prontuario" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="prontuario">
                  <FileText className="h-4 w-4 mr-2" />
                  Prontuário
                </TabsTrigger>
                <TabsTrigger value="finalizar">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Finalizar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="prontuario" className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => setShowMedicalRecordForm(true)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Novo Registro
                  </Button>
                </div>

                <MedicalRecordHistory
                  patientId={attendance.patientId}
                  patientName={selectedPatient?.patientName || ''}
                />

                <MedicalRecordForm
                  open={showMedicalRecordForm}
                  onOpenChange={setShowMedicalRecordForm}
                  visitId={attendance.visitId}
                  patientName={selectedPatient?.patientName || ''}
                  onSuccess={() => {
                    setShowMedicalRecordForm(false);
                    toast.success('Registro salvo no prontuário');
                  }}
                />
              </TabsContent>

              <TabsContent value="finalizar" className="space-y-4">
                <Alert>
                  <AlertDescription>
                    Finalize o atendimento selecionando o desfecho apropriado.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleCloseDialog}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button onClick={() => setShowOutcomeForm(true)}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Finalizar atendimento
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <Alert>
              <AlertDescription>
                Carregando dados do atendimento...
              </AlertDescription>
            </Alert>
          )}
        </DialogContent>
      </Dialog>

      {attendance && (
        <AttendanceOutcomeForm
          open={showOutcomeForm}
          onOpenChange={setShowOutcomeForm}
          attendanceId={attendance.id}
           patientId={attendance.patientId}
          patientName={selectedPatient?.patientName || ''}
          attendanceNumber={attendance.attendanceNumber}
          onSuccess={() => {
            setShowOutcomeForm(false);
            handleCloseDialog();
            loadPatients();
          }}
        />
      )}
    </div>
  );
}
