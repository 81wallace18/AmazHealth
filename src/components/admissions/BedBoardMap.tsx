import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, MapPin, RefreshCw, User } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { admissionService } from '@/services/admissionService';
import type { Admission, Bed, BedStatus, WardBoard } from '@/types/admission';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const statusColors: Record<BedStatus, string> = {
  AVAILABLE: 'border-emerald-500 text-emerald-600',
  OCCUPIED: 'border-slate-500 text-slate-600',
  RESERVED: 'border-amber-500 text-amber-600',
  MAINTENANCE: 'border-rose-500 text-rose-600',
  BLOCKED: 'border-zinc-500 text-zinc-600',
  CLEANING: 'border-blue-500 text-blue-600',
};

export function BedBoardMap() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BedStatus | 'ALL'>('ALL');
  const [bedDetails, setBedDetails] = useState<Bed | null>(null);
  const [assignBed, setAssignBed] = useState<Bed | null>(null);

  const queryClient = useQueryClient();

  const bedBoardQuery = useQuery({
    queryKey: ['bed-board', 'map'],
    queryFn: () => admissionService.getBedBoard(),
    refetchInterval: 30 * 1000,
  });

  const wards = useMemo(() => {
    const items = (bedBoardQuery.data as WardBoard[]) ?? [];
    if (!search.trim() && statusFilter === 'ALL') {
      return items;
    }

    return items
      .map((ward) => ({
        ...ward,
        beds: ward.beds.filter((bed) => {
          const matchesStatus = statusFilter === 'ALL' || bed.status === statusFilter;
          const matchesSearch = search
            ? bed.fullBedIdentifier?.toLowerCase().includes(search.toLowerCase()) ||
              bed.patientName?.toLowerCase().includes(search.toLowerCase())
            : true;
          return matchesStatus && matchesSearch;
        }),
      }))
      .filter((ward) => ward.beds.length > 0);
  }, [bedBoardQuery.data, search, statusFilter]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-xl font-semibold">Mapa de Leitos</CardTitle>
          <p className="text-sm text-muted-foreground">
            Visualize a ocupação dos leitos e aloque pacientes diretamente.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => bedBoardQuery.refetch()}
          disabled={bedBoardQuery.isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${bedBoardQuery.isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <Input
            placeholder="Buscar por leito ou paciente"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as BedStatus | 'ALL')}>
            <SelectTrigger className="md:w-[220px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os status</SelectItem>
              <SelectItem value="AVAILABLE">Disponíveis</SelectItem>
              <SelectItem value="OCCUPIED">Ocupados</SelectItem>
              <SelectItem value="CLEANING">Limpeza</SelectItem>
              <SelectItem value="RESERVED">Reservados</SelectItem>
              <SelectItem value="MAINTENANCE">Manutenção</SelectItem>
              <SelectItem value="BLOCKED">Bloqueados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {bedBoardQuery.isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {!bedBoardQuery.isLoading && wards.length === 0 && (
          <div className="text-center text-muted-foreground py-10">
            Nenhum leito encontrado para os filtros selecionados.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {wards.map((ward) => (
            <Card key={ward.wardId} className="border border-slate-200">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {ward.wardName}
                </CardTitle>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{ward.beds.length} leitos listados</span>
                  <span>Ocupação: {ward.occupancyRate}%</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {ward.beds.map((bed) => (
                    <button
                      key={bed.id}
                      type="button"
                      className={cn(
                        'rounded-md border px-3 py-2 text-left text-sm transition hover:shadow-sm',
                        statusColors[bed.status]
                      )}
                      onClick={() => {
                        if (bed.isAvailable) {
                          setAssignBed(bed);
                        } else {
                          setBedDetails(bed);
                        }
                      }}
                    >
                      <div className="font-semibold">{bed.fullBedIdentifier || bed.bedNumber}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {bed.isOccupied ? bed.patientName : 'Disponível'}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>

      <BedDetailsDialog bed={bedDetails} onOpenChange={(open) => !open && setBedDetails(null)} />

      <AssignAdmissionDialog
        bed={assignBed}
        onOpenChange={(open) => !open && setAssignBed(null)}
        onSuccess={() => {
          setAssignBed(null);
          queryClient.invalidateQueries({ queryKey: ['bed-board'] });
          queryClient.invalidateQueries({ queryKey: ['admissions'] });
        }}
      />
    </Card>
  );
}

function BedDetailsDialog({ bed, onOpenChange }: { bed: Bed | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={!!bed} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalhes do leito</DialogTitle>
          <DialogDescription>Informações sobre o leito selecionado.</DialogDescription>
        </DialogHeader>

        {bed && (
          <div className="space-y-3">
            <div>
              <Label>Identificação</Label>
              <p className="font-semibold">{bed.fullBedIdentifier || bed.bedNumber}</p>
            </div>
            {bed.patientName ? (
              <div>
                <Label>Paciente</Label>
                <p className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {bed.patientName}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Leito disponível</p>
            )}
            <div className="flex gap-2">
              <Badge variant="outline">{bed.statusDescription}</Badge>
              {bed.wardName && <Badge variant="secondary">{bed.wardName}</Badge>}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface AssignAdmissionDialogProps {
  bed: Bed | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function AssignAdmissionDialog({ bed, onOpenChange, onSuccess }: AssignAdmissionDialogProps) {
  const [selectedAdmission, setSelectedAdmission] = useState<string>('');
  const waitingAdmissions = useQuery({
    queryKey: ['admissions', 'awaiting-bed'],
    enabled: !!bed,
    queryFn: () => admissionService.listAwaitingBed(),
  });

  const handleAllocate = async () => {
    if (!bed || !selectedAdmission) return;
    try {
      await admissionService.allocateBed({
        admissionId: selectedAdmission,
        bedId: bed.id,
        reason: 'Alocação a partir do mapa de leitos',
      });
      toast.success('Leito atribuído com sucesso.');
      setSelectedAdmission('');
      onSuccess();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Não foi possível alocar o leito.';
      toast.error(message);
    }
  };

  return (
    <Dialog open={!!bed} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alocar paciente</DialogTitle>
          <DialogDescription>
            Selecione um paciente aguardando leito para alocar no leito {bed?.fullBedIdentifier}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Paciente aguardando</Label>
            <Select
              value={selectedAdmission}
              onValueChange={setSelectedAdmission}
              disabled={waitingAdmissions.isLoading || (waitingAdmissions.data?.length ?? 0) === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={waitingAdmissions.isLoading ? 'Carregando...' : 'Selecione'} />
              </SelectTrigger>
              <SelectContent>
                {waitingAdmissions.data?.map((admission: Admission) => (
                  <SelectItem key={admission.id} value={admission.id}>
                    {admission.patientName} · {admission.admissionReason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleAllocate} disabled={!selectedAdmission}>
            {waitingAdmissions.isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
