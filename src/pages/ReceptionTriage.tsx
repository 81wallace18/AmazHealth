import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Search, UserPlus, AlertTriangle, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReceptionQueueList } from "@/components/reception/ReceptionQueueList";
import { PatientRegistrationForm } from "@/components/reception/PatientRegistrationForm";
import { NewAttendanceDialog } from "@/components/attendance/NewAttendanceDialog";
import { EmergencyBypassDialog } from "@/components/attendance/EmergencyBypassDialog";
import receptionService from "@/services/receptionService";
import attendanceService from "@/services/attendanceService";
import { patientService } from "@/services/patientService";
import type { ReceptionPatientListItem, ReceptionQueueItem } from "@/types/reception";
import type { Patient } from "@/types/patient";
import { toast } from "sonner";

export default function ReceptionTriage() {
  // Busca
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ReceptionPatientListItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Fila
  const [queueItems, setQueueItems] = useState<ReceptionQueueItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);

  // Dialogs
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isBypassOpen, setIsBypassOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Carrega fila de triagem
  const loadQueue = useCallback(async () => {
    try {
      const data = await receptionService.listTriageBoard();
      setQueueItems(data);
    } catch (error) {
      console.error("Erro ao carregar fila:", error);
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  // Busca de pacientes
  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (q.length < 2) return;

    setSearching(true);
    setHasSearched(true);
    try {
      const result = await receptionService.listPatients({ query: q, size: 10 });
      setSearchResults(result.content);
    } catch (error) {
      console.error("Erro na busca:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  // Abrir atendimento
  const handleOpenAttendance = async (item: ReceptionPatientListItem) => {
    try {
      const patient = await patientService.getById(item.patientId);
      setSelectedPatient(patient);
      setIsAttendanceOpen(true);
    } catch {
      toast.error("Erro ao carregar dados do paciente.");
    }
  };

  // Emergencia
  const handleEmergency = async (item: ReceptionPatientListItem) => {
    try {
      const patient = await patientService.getById(item.patientId);
      setSelectedPatient(patient);
      setIsBypassOpen(true);
    } catch {
      toast.error("Erro ao carregar dados do paciente.");
    }
  };

  // Criar atendimento
  const handleCreateAttendance = async (data: { visitType: 'URGENCIA' | 'AMBULATORIAL'; doctorId?: string; chiefComplaint: string }) => {
    if (!selectedPatient) return;
    await attendanceService.create({
      patientId: selectedPatient.id,
      visitType: data.visitType,
      chiefComplaint: data.chiefComplaint,
      ...(data.doctorId ? { doctorId: data.doctorId } : {}),
    });
    await loadQueue();
    // Re-busca para atualizar status "inAttendance"
    if (hasSearched) await handleSearch();
  };

  // Cadastrar paciente
  const handleRegisterPatient = async (data: any) => {
    try {
      await patientService.create(data);
      toast.success("Paciente cadastrado com sucesso.");
      setIsRegisterOpen(false);
      // Re-busca automatica pelo nome cadastrado
      setSearchQuery(`${data.firstName} ${data.lastName}`);
      const result = await receptionService.listPatients({
        query: `${data.firstName} ${data.lastName}`,
        size: 10,
      });
      setSearchResults(result.content);
      setHasSearched(true);
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Erro ao cadastrar paciente.";
      toast.error(msg);
      throw error;
    }
  };

  const handleRefresh = async () => {
    await loadQueue();
    if (hasSearched) await handleSearch();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Recepção</h1>
          <p className="text-muted-foreground">
            Registrar entrada, localizar paciente e abrir atendimento
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Busca + Cadastro */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou cartão SUS..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
            <Button onClick={handleSearch} disabled={searching || searchQuery.trim().length < 2}>
              {searching ? "Buscando..." : "Buscar"}
            </Button>
            <Button variant="outline" onClick={() => setIsRegisterOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Paciente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados da busca */}
      {hasSearched && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">
              Resultados ({searchResults.length})
            </h3>
            {searchResults.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhum paciente encontrado. Cadastre um novo paciente acima.
              </p>
            ) : (
              <div className="space-y-3">
                {searchResults.map((item) => (
                  <div
                    key={item.patientId}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                        {item.patientName
                          .split(" ")
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{item.patientName}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="font-mono">{item.patientCode}</span>
                          <span>
                            {new Date(item.dateOfBirth).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.inAttendance ? (
                        <Badge variant="secondary">Atendimento ativo</Badge>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleOpenAttendance(item)}
                          >
                            <Stethoscope className="h-4 w-4 mr-1" />
                            Abrir Atendimento
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-50"
                            onClick={() => handleEmergency(item)}
                          >
                            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                            Emergência
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Fila de Triagem */}
      <div>
        <h2 className="text-xl font-semibold mb-3">
          Fila de Triagem
          {queueItems.length > 0 && (
            <Badge variant="outline" className="ml-2">
              {queueItems.length}
            </Badge>
          )}
        </h2>
        {loadingQueue ? (
          <p className="text-muted-foreground">Carregando fila...</p>
        ) : (
          <ReceptionQueueList
            title="Aguardando triagem"
            items={queueItems}
            emptyMessage="Nenhum paciente na fila de triagem."
          />
        )}
      </div>

      {/* Dialog: Cadastro de paciente */}
      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Paciente</DialogTitle>
            <DialogDescription>
              Preencha os dados para cadastrar um novo paciente.
            </DialogDescription>
          </DialogHeader>
          <PatientRegistrationForm
            onSubmit={handleRegisterPatient}
            onCancel={() => setIsRegisterOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Novo Atendimento */}
      <NewAttendanceDialog
        patient={selectedPatient}
        open={isAttendanceOpen}
        onOpenChange={(open) => {
          setIsAttendanceOpen(open);
          if (!open) setSelectedPatient(null);
        }}
        onSubmit={handleCreateAttendance}
      />

      {/* Dialog: Emergência */}
      <EmergencyBypassDialog
        patient={selectedPatient}
        open={isBypassOpen}
        onOpenChange={(open) => {
          setIsBypassOpen(open);
          if (!open) setSelectedPatient(null);
        }}
        onSuccess={() => {
          loadQueue();
          if (hasSearched) handleSearch();
        }}
      />
    </div>
  );
}
