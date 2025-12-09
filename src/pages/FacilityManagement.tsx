import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Building2, DoorOpen } from 'lucide-react';
import sectorService, { CreateSectorRequest } from '@/services/sectorService';
import wardService, { CreateWardRequest } from '@/services/wardService';

// Schema de validação para setor
const sectorSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  type: z.string().min(1, 'Tipo é obrigatório'),
});

// Schema de validação para ward
const wardSchema = z.object({
  code: z.string().min(2, 'Código deve ter pelo menos 2 caracteres'),
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  wardType: z.string().min(1, 'Tipo é obrigatório'),
  floorNumber: z.number().optional(),
  block: z.string().optional(),
  phoneExtension: z.string().optional(),
  visitingHours: z.string().optional(),
  specialEquipment: z.string().optional(),
  responsibleNurse: z.string().optional(),
  notes: z.string().optional(),
});

const SECTOR_TYPES = [
  { value: 'RECEPTION', label: 'Recepção' },
  { value: 'TRIAGE', label: 'Triagem' },
  { value: 'EMERGENCY', label: 'Emergência' },
  { value: 'URGENCY', label: 'Urgência' },
  { value: 'WARD', label: 'Enfermaria' },
  { value: 'LABORATORY', label: 'Laboratório' },
  { value: 'RADIOLOGY', label: 'Radiologia' },
  { value: 'PHARMACY', label: 'Farmácia' },
];

const WARD_TYPES = [
  { value: 'INFIRMARY', label: 'Enfermaria' },
  { value: 'ICU', label: 'UTI' },
  { value: 'EMERGENCY_ROOM', label: 'Sala de Emergência' },
  { value: 'PRIVATE_ROOM', label: 'Quarto Privado' },
  { value: 'SEMI_PRIVATE', label: 'Semi-privado' },
  { value: 'PEDIATRIC', label: 'Pediátrico' },
  { value: 'MATERNITY', label: 'Maternidade' },
  { value: 'SURGICAL_CENTER', label: 'Centro Cirúrgico' },
  { value: 'RECOVERY', label: 'Recuperação' },
  { value: 'OBSERVATION', label: 'Observação' },
];

export default function FacilityManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sectorDialogOpen, setSectorDialogOpen] = useState(false);
  const [wardDialogOpen, setWardDialogOpen] = useState(false);

  // Queries
  const sectorsQuery = useQuery({
    queryKey: ['sectors'],
    queryFn: () => sectorService.list(),
  });

  const wardsQuery = useQuery({
    queryKey: ['wards'],
    queryFn: () => wardService.list(0, 100),
  });

  // Forms
  const sectorForm = useForm<CreateSectorRequest>({
    resolver: zodResolver(sectorSchema),
    defaultValues: {
      name: '',
      type: '',
    },
  });

  const wardForm = useForm<CreateWardRequest>({
    resolver: zodResolver(wardSchema),
    defaultValues: {
      code: '',
      name: '',
      wardType: '',
    },
  });

  // Mutations
  const createSectorMutation = useMutation({
    mutationFn: (data: CreateSectorRequest) => sectorService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sectors'] });
      toast({
        title: 'Setor criado!',
        description: 'O setor foi adicionado com sucesso.',
      });
      setSectorDialogOpen(false);
      sectorForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar setor',
        description: error.response?.data?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const createWardMutation = useMutation({
    mutationFn: (data: CreateWardRequest) => wardService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wards'] });
      toast({
        title: 'Enfermaria criada!',
        description: 'A enfermaria foi adicionada com sucesso.',
      });
      setWardDialogOpen(false);
      wardForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar enfermaria',
        description: error.response?.data?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Instalações</h1>
        <p className="text-muted-foreground">Gerencie setores e enfermarias do hospital</p>
      </div>

      <Tabs defaultValue="sectors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sectors">Setores</TabsTrigger>
          <TabsTrigger value="wards">Enfermarias</TabsTrigger>
        </TabsList>

        <TabsContent value="sectors" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Setores</CardTitle>
                  <CardDescription>Setores organizacionais (PA, Triagem, etc.)</CardDescription>
                </div>
                <Button onClick={() => setSectorDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Setor
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sectorsQuery.isLoading ? (
                <div className="text-center py-4">Carregando...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sectorsQuery.data?.map((sector) => (
                      <TableRow key={sector.id}>
                        <TableCell className="font-medium">{sector.name}</TableCell>
                        <TableCell>{sector.type}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wards" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Enfermarias</CardTitle>
                  <CardDescription>Unidades de internação hospitalar</CardDescription>
                </div>
                <Button onClick={() => setWardDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Enfermaria
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {wardsQuery.isLoading ? (
                <div className="text-center py-4">Carregando...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Andar/Bloco</TableHead>
                      <TableHead>Leitos</TableHead>
                      <TableHead>Ocupação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wardsQuery.data?.content.map((ward) => (
                      <TableRow key={ward.id}>
                        <TableCell className="font-medium">{ward.code}</TableCell>
                        <TableCell>{ward.name}</TableCell>
                        <TableCell>{ward.wardType}</TableCell>
                        <TableCell>
                          {ward.floorNumber && ward.block
                            ? `${ward.floorNumber}º andar - Bloco ${ward.block}`
                            : '-'}
                        </TableCell>
                        <TableCell>{ward.totalBeds}</TableCell>
                        <TableCell>
                          {ward.occupiedBeds} / {ward.totalBeds} ({Math.round((ward.occupiedBeds / ward.totalBeds) * 100)}%)
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Criar Setor */}
      <Dialog open={sectorDialogOpen} onOpenChange={setSectorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Setor</DialogTitle>
            <DialogDescription>Cadastre um novo setor organizacional</DialogDescription>
          </DialogHeader>
          <Form {...sectorForm}>
            <form onSubmit={sectorForm.handleSubmit((data) => createSectorMutation.mutate(data))} className="space-y-4">
              <FormField
                control={sectorForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Recepção PA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={sectorForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SECTOR_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setSectorDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createSectorMutation.isPending}>
                  {createSectorMutation.isPending ? 'Criando...' : 'Criar Setor'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog Criar Enfermaria */}
      <Dialog open={wardDialogOpen} onOpenChange={setWardDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Enfermaria</DialogTitle>
            <DialogDescription>Cadastre uma nova unidade de internação</DialogDescription>
          </DialogHeader>
          <Form {...wardForm}>
            <form onSubmit={wardForm.handleSubmit((data) => createWardMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={wardForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: ENF-01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={wardForm.control}
                  name="wardType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {WARD_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={wardForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Enfermaria Clínica" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={wardForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Descrição da enfermaria" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={wardForm.control}
                  name="floorNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Andar</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={wardForm.control}
                  name="block"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bloco</FormLabel>
                      <FormControl>
                        <Input placeholder="A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={wardForm.control}
                  name="phoneExtension"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ramal</FormLabel>
                      <FormControl>
                        <Input placeholder="2001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={wardForm.control}
                name="visitingHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Visitas</FormLabel>
                    <FormControl>
                      <Input placeholder="14h às 20h" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={wardForm.control}
                name="specialEquipment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipamentos Especiais</FormLabel>
                    <FormControl>
                      <Input placeholder="Monitor multiparâmetro, ventilador mecânico" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setWardDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createWardMutation.isPending}>
                  {createWardMutation.isPending ? 'Criando...' : 'Criar Enfermaria'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
