import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Moon, Sun, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import dutyService, { DutyResponse, StartDutyRequest } from '@/services/dutyService';
import { staffService } from '@/services/staffService';
import sectorService from '@/services/sectorService';

export default function DutyManagement() {
  const { user } = useAuth();
  const [duties, setDuties] = useState<DutyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [sectorList, setSectorList] = useState<any[]>([]);
  const [form, setForm] = useState<StartDutyRequest>({
    staffId: '',
    sectorId: '',
    shiftType: 'NIGHT',
  });

  const loadDuties = async () => {
    try {
      setLoading(true);
      const data = await dutyService.getActiveDuties();
      setDuties(data);
    } catch (error) {
      toast.error('Erro ao carregar plantões ativos');
    } finally {
      setLoading(false);
    }
  };

  const loadFormData = async () => {
    try {
      const [staff, sectors] = await Promise.all([
        staffService.findAllActive(),
        sectorService.list(),
      ]);
      setStaffList(staff);
      setSectorList(sectors);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    loadDuties();
    loadFormData();
  }, []);

  const handleStart = async () => {
    if (!form.staffId || !form.sectorId) {
      toast.error('Selecione o profissional e o setor');
      return;
    }
    try {
      await dutyService.startDuty(form);
      toast.success('Plantão iniciado com sucesso');
      setDialogOpen(false);
      setForm({ staffId: '', sectorId: '', shiftType: 'NIGHT' });
      loadDuties();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao iniciar plantão');
    }
  };

  const handleEnd = async (dutyId: string) => {
    try {
      await dutyService.endDuty(dutyId);
      toast.success('Plantão encerrado');
      loadDuties();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao encerrar plantão');
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Plantão</h1>
          <p className="text-muted-foreground">Registre e acompanhe plantões ativos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Play className="mr-2 h-4 w-4" />
              Iniciar Plantão
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Iniciar Plantão</DialogTitle>
              <DialogDescription>Registre o início de plantão de um profissional</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Profissional</Label>
                <Select value={form.staffId} onValueChange={(v) => setForm({ ...form, staffId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {staffList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.firstName} {s.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Setor</Label>
                <Select value={form.sectorId} onValueChange={(v) => setForm({ ...form, sectorId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {sectorList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Turno</Label>
                <Select value={form.shiftType} onValueChange={(v) => setForm({ ...form, shiftType: v as 'DAY' | 'NIGHT' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NIGHT">Noturno</SelectItem>
                    <SelectItem value="DAY">Diurno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleStart}>Iniciar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plantões Ativos</CardTitle>
          <CardDescription>{duties.length} plantão(ões) em andamento</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Carregando...</p>
          ) : duties.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Nenhum plantão ativo no momento</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Previsão Fim</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {duties.map((duty) => (
                  <TableRow key={duty.id}>
                    <TableCell className="font-medium">{duty.staffName || duty.staffId}</TableCell>
                    <TableCell>{duty.sectorName || duty.sectorId}</TableCell>
                    <TableCell>
                      <Badge variant={duty.shiftType === 'NIGHT' ? 'default' : 'secondary'}
                             className={duty.shiftType === 'NIGHT' ? 'bg-indigo-600' : ''}>
                        {duty.shiftType === 'NIGHT' ? (
                          <><Moon className="h-3 w-3 mr-1" />Noturno</>
                        ) : (
                          <><Sun className="h-3 w-3 mr-1" />Diurno</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatTime(duty.startsAt)}</TableCell>
                    <TableCell>{duty.endsAt ? formatTime(duty.endsAt) : '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="destructive" size="sm" onClick={() => handleEnd(duty.id)}>
                        <Square className="h-3 w-3 mr-1" />
                        Encerrar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
