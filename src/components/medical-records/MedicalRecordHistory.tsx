import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { medicalRecordService } from '@/services/medicalRecordService';
import type { MedicalRecordResponse } from '@/types/medicalRecord';
import { RECORD_TYPE_LABELS } from '@/types/medicalRecord';
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Clock,
  User,
  Calendar,
  AlertCircle,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { MedicalRecordForm } from './MedicalRecordForm';

interface MedicalRecordHistoryProps {
  patientId: string;
  patientName?: string;
  visitId?: string; // Se fornecido, filtra por visita
  patientCode?: string;
  attendanceNumber?: string;
}

/**
 * Componente para exibir histórico do prontuário eletrônico
 *
 * Features:
 * - Lista paginada de registros
 * - Expand/collapse para ver detalhes
 * - Editar (somente autor, 24h)
 * - Deletar com confirmação (somente autor, 24h)
 * - Badges de tipo e tempo restante
 * - Loading states
 *
 * Uso:
 * ```tsx
 * <MedicalRecordHistory
 *   patientId={patient.id}
 *   patientName={patient.fullName}
 * />
 * ```
 */
export function MedicalRecordHistory({
  patientId,
  patientName,
  visitId,
  patientCode,
  attendanceNumber,
}: MedicalRecordHistoryProps) {
  const queryClient = useQueryClient();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deleteRecord, setDeleteRecord] = useState<MedicalRecordResponse | null>(null);
  const [editRecord, setEditRecord] = useState<MedicalRecordResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);
  const [isGeneratingDeclaration, setIsGeneratingDeclaration] = useState(false);

  // Buscar registros
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: visitId
      ? ['medical-records', 'visit', visitId]
      : ['medical-records', 'patient', patientId],
    queryFn: () =>
      visitId
        ? medicalRecordService.findByVisit(visitId)
        : medicalRecordService.findByPatient(patientId).then((res) => res.content),
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDelete = async (id: string, reason: string) => {
    setIsDeleting(true);
    try {
      await medicalRecordService.delete(id);
      toast.success('Registro deletado', {
        description: 'O registro foi removido do prontuário.',
      });
      setDeleteRecord(null);
      refetch();
    } catch (error: any) {
      console.error('Erro ao deletar registro:', error);
      if (error.response?.status === 403) {
        toast.error('Sem permissão', {
          description: 'Apenas o autor pode deletar este registro nas primeiras 24h.',
        });
      } else {
        toast.error('Erro ao deletar', {
          description: error.response?.data?.message || 'Tente novamente.',
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const formatEditTime = (minutes: number | null): string => {
    if (minutes === null) return '';
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleGenerateCertificate = async () => {
    if (!patientName) {
      toast.error('Selecione um paciente para gerar o documento.');
      return;
    }
    const typeInput = window
      .prompt('Tipo de atestado (WORK_LEAVE, FIT_FOR_WORK, EXAM):', 'WORK_LEAVE')
      ?.toUpperCase()
      .trim();
    if (!typeInput) {
      return;
    }
    if (!['WORK_LEAVE', 'FIT_FOR_WORK', 'EXAM'].includes(typeInput)) {
      toast.error('Tipo de atestado inválido.');
      return;
    }
    let days: string | undefined;
    if (typeInput === 'WORK_LEAVE') {
      const daysInput = window.prompt('Quantidade de dias de afastamento?', '3');
      if (!daysInput) {
        toast.error('Informe os dias de afastamento.');
        return;
      }
      days = daysInput;
    }
    const observations = window.prompt('Observações (opcional)') ?? undefined;

    setIsGeneratingCertificate(true);
    try {
      const blob = await medicalRecordService.generateMedicalCertificate({
        patientName,
        patientCode,
        type: typeInput as 'WORK_LEAVE' | 'FIT_FOR_WORK' | 'EXAM',
        days,
        observations,
      });
      downloadBlob(blob, `atestado_${patientId}.pdf`);
      toast.success('Atestado gerado com sucesso.');
    } catch (error: any) {
      console.error('Erro ao gerar atestado:', error);
      toast.error(error?.response?.data?.message || 'Não foi possível gerar o atestado.');
    } finally {
      setIsGeneratingCertificate(false);
    }
  };

  const handleGenerateDeclaration = async () => {
    if (!patientName) {
      toast.error('Selecione um paciente para gerar o documento.');
      return;
    }
    const purpose = window.prompt('Finalidade da declaração (opcional)') ?? undefined;

    setIsGeneratingDeclaration(true);
    try {
      const blob = await medicalRecordService.generateAttendanceDeclaration({
        patientName,
        patientCode,
        attendanceNumber,
        purpose,
      });
      downloadBlob(blob, `declaracao_${patientId}.pdf`);
      toast.success('Declaração gerada com sucesso.');
    } catch (error: any) {
      console.error('Erro ao gerar declaração:', error);
      toast.error(error?.response?.data?.message || 'Não foi possível gerar a declaração.');
    } finally {
      setIsGeneratingDeclaration(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-muted-foreground">
            Erro ao carregar histórico do prontuário
          </p>
        </CardContent>
      </Card>
    );
  }

  const records = data || [];

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhum registro no prontuário</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {patientName && (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateCertificate}
            disabled={isGeneratingCertificate}
          >
            <Download className="mr-2 h-4 w-4" />
            Atestado
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateDeclaration}
            disabled={isGeneratingDeclaration}
          >
            <Download className="mr-2 h-4 w-4" />
            Declaração
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {records.map((record) => {
          const isExpanded = expandedIds.has(record.id);
          const recordDate = new Date(record.createdAt);

          return (
            <Card key={record.id}>
              <Collapsible open={isExpanded} onOpenChange={() => toggleExpand(record.id)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">
                          {RECORD_TYPE_LABELS[record.recordType]}
                        </Badge>
                        {record.editable && record.editTimeRemaining && (
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Editável por {formatEditTime(record.editTimeRemaining)}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(recordDate, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <User className="h-3 w-3 inline mr-1" />
                        {record.doctorName} ({record.doctorRegistration})
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      {record.editable && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditRecord(record)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteRecord(record)}
                            title="Deletar"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}

                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                </CardHeader>

                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    {/* Campos SOAP */}
                    {record.chiefComplaint && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">S - Queixa Principal</h4>
                        <p className="text-sm text-muted-foreground">
                          {record.chiefComplaint}
                        </p>
                      </div>
                    )}

                    {record.historyOfPresentIllness && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">
                          S - História da Doença Atual
                        </h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {record.historyOfPresentIllness}
                        </p>
                      </div>
                    )}

                    {record.physicalExamination && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">O - Exame Físico</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {record.physicalExamination}
                        </p>
                      </div>
                    )}

                    {record.diagnosis && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">
                          A - Diagnóstico / Hipótese
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {record.diagnosis}
                        </p>
                      </div>
                    )}

                    {record.treatment && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">P - Plano / Conduta</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {record.treatment}
                        </p>
                      </div>
                    )}

                    {/* Notas (HTML do Tiptap) */}
                    <div>
                      <h4 className="font-medium text-sm mb-1">Notas do Registro</h4>
                      <div
                        className="prose prose-sm max-w-none text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: record.notes }}
                      />
                    </div>

                    {/* Metadados */}
                    <div className="pt-2 border-t text-xs text-muted-foreground">
                      Criado em{' '}
                      {format(new Date(record.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                      {record.updatedAt !== record.createdAt && (
                        <>
                          {' • Editado em '}
                          {format(new Date(record.updatedAt), "dd/MM/yyyy 'às' HH:mm")}
                        </>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Dialog de Edição */}
      {editRecord && (
        <MedicalRecordForm
          open={!!editRecord}
          onOpenChange={(open) => !open && setEditRecord(null)}
          visitId={editRecord.visitId || ''}
          patientName={patientName}
          recordId={editRecord.id}
          defaultValues={{
            visitId: editRecord.visitId || '',
            recordType: editRecord.recordType,
            chiefComplaint: editRecord.chiefComplaint,
            historyOfPresentIllness: editRecord.historyOfPresentIllness,
            physicalExamination: editRecord.physicalExamination,
            diagnosis: editRecord.diagnosis,
            treatment: editRecord.treatment,
            notes: editRecord.notes,
          }}
          onSuccess={() => {
            setEditRecord(null);
            refetch();
          }}
        />
      )}

      {/* Dialog de Confirmação de Deleção */}
      {deleteRecord && (
        <DeleteConfirmationDialog
          open={!!deleteRecord}
          onOpenChange={(open) => !open && setDeleteRecord(null)}
          onConfirm={(reason) => handleDelete(deleteRecord.id, reason)}
          title="Deletar Registro do Prontuário?"
          description="Esta ação não pode ser desfeita. O registro será removido permanentemente do prontuário do paciente."
          entityName={`${RECORD_TYPE_LABELS[deleteRecord.recordType]} - ${format(
            new Date(deleteRecord.createdAt),
            "dd/MM/yyyy 'às' HH:mm"
          )}`}
          requireReason
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}
