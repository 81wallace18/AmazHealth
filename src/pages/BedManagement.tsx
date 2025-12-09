import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Bed, Wrench, Sparkles } from 'lucide-react';
import bedService, { CreateBedRequest } from '@/services/bedService';
import wardService from '@/services/wardService';

// Schema de validação
const bedSchema = z.object({
  wardId: z.string().min(1, 'Enfermaria é obrigatória'),
  bedNumber: z.string().min(1, 'Número do leito é obrigatório'),
  bedType: z.string().min(1, 'Tipo é obrigatório'),
  nearWindow: z.boolean().default(false),
  oxygenSupport: z.boolean().default(false),
  suctionSupport: z.boolean().default(false),
  monitorSupport: z.boolean().default(false),
  isIsolation: z.boolean().default(false),
  specialNeeds: z.string().optional(),
  priorityLevel: z.number().min(0).max(10).default(0),
});

const BED_STATUS_LABELS = {
  available: { label: 'Disponível', variant: 'default' as const },
  occupied: { label: 'Ocupado', variant: 'destructive' as const },
  reserved: { label: 'Reservado', variant: 'secondary' as const },
  maintenance: { label: 'Manutenção', variant: 'outline' as const },
  blocked: { label: 'Bloqueado', variant: 'destructive' as const },
  cleaning: { label: 'Limpeza', variant: 'secondary' as const },
};

export default function BedManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Queries
  const bedsQuery = useQuery({
    queryKey: ['beds'],
    queryFn: () => bedService.list(0, 100),
  });

  const wardsQuery = useQuery({
    queryKey: ['wards'],
    queryFn: () => wardService.listAvailable(),
  });

  // Form
  const form = useForm<CreateBedRequest>({
    resolver: zodResolver(bedSchema),
    defaultValues: {
      wardId: '',
      bedNumber: '',
      bedType: '',
      nearWindow: false,
      oxygenSupport: false,
      suctionSupport: false,
      monitorSupport: false,
      isIsolation: false,
      priorityLevel: 0,
    },
  });

  // Mutations
  const createBedMutation = useMutation({
    mutationFn: (data: CreateBedRequest) => bedService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      toast({
        title: 'Leito criado!',
        description: 'O leito foi adicionado com sucesso.',
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar leito',
        description: error.response?.data?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const markMaintenanceMutation = useMutation({
    mutationFn: ({ bedId, reason }: { bedId: string; reason: string }) =>
      bedService.markForMaintenance(bedId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      toast({
        title: 'Leito em manutenção',
        description: 'O leito foi marcado para manutenção.',
      });
    },
  });

  const markCleanedMutation = useMutation({
    mutationFn: (bedId: string) => bedService.markAsCleaned(bedId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      toast({
        title: 'Leito limpo',
        description: 'O leito foi marcado como limpo e disponível.',
      });
    },
  });

  const handleMaintenance = (bedId: string) => {
    const reason = prompt('Motivo da manutenção:');
    if (reason) {
      markMaintenanceMutation.mutate({ bedId, reason });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Leitos</h1>
          <p className="text-muted-foreground">Gerencie os leitos hospitalares</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Leito
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leitos Cadastrados</CardTitle>
          <CardDescription>
            Total: {bedsQuery.data?.totalElements || 0} leitos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bedsQuery.isLoading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leito</TableHead>
                  <TableHead>Enfermaria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recursos</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bedsQuery.data?.content.map((bed) => (
                  <TableRow key={bed.id}>
                    <TableCell className="font-medium">{bed.bedNumber}</TableCell>
                    <TableCell>{bed.wardName || '-'}</TableCell>
                    <TableCell>{bed.bedType}</TableCell>
                    <TableCell>
                      <Badge variant={BED_STATUS_LABELS[bed.status]?.variant || 'default'}>
                        {BED_STATUS_LABELS[bed.status]?.label || bed.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 text-xs">
                        {bed.oxygenSupport && <Badge variant="outline">O₂</Badge>}
                        {bed.monitorSupport && <Badge variant="outline">Monitor</Badge>}
                        {bed.suctionSupport && <Badge variant="outline">Aspiração</Badge>}
                        {bed.isIsolation && <Badge variant="destructive">Isolamento</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{bed.currentPatientName || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {bed.status === 'cleaning' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markCleanedMutation.mutate(bed.id)}
                          >
                            <Sparkles className="h-4 w-4 mr-1" />
                            Limpo
                          </Button>
                        )}
                        {bed.status === 'available' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMaintenance(bed.id)}
                          >
                            <Wrench className="h-4 w-4 mr-1" />
                            Manutenção
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Criar Leito */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Leito</DialogTitle>
            <DialogDescription>Cadastre um novo leito hospitalar</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createBedMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="wardId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enfermaria *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {wardsQuery.data?.map((ward) => (
                            <SelectItem key={ward.id} value={ward.id}>
                              {ward.code} - {ward.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bedNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do Leito *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: ENF-01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bedType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Enfermaria, UTI" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priorityLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível de Prioridade</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={10}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>0 = baixa, 10 = alta prioridade</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-3 border rounded-lg p-4">
                <h3 className="font-semibold">Recursos Disponíveis</h3>
                <FormField
                  control={form.control}
                  name="nearWindow"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Próximo à janela</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="oxygenSupport"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Suporte de oxigênio</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="suctionSupport"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Suporte de aspiração</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="monitorSupport"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Monitor multiparâmetro</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isIsolation"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Leito de isolamento</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="specialNeeds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Necessidades Especiais</FormLabel>
                    <FormControl>
                      <Input placeholder="Outras características ou necessidades" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createBedMutation.isPending}>
                  {createBedMutation.isPending ? 'Criando...' : 'Criar Leito'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
