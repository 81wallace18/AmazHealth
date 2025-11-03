import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { staffService, type Staff, type RoleType, type StaffStatus } from '@/services/staffService';
import { useEffect } from 'react';

const staffFormSchema = z.object({
  firstName: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  lastName: z.string()
    .min(1, 'Sobrenome é obrigatório')
    .max(100, 'Sobrenome deve ter no máximo 100 caracteres'),
  role: z.enum(['doctor', 'nurse', 'admin', 'receptionist', 'pharmacist', 'lab_technician'], {
    required_error: 'Função é obrigatória',
  }),
  specialization: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email('Email inválido').max(100).optional().or(z.literal('')),
  hireDate: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE']).optional(),
});

type StaffFormData = z.infer<typeof staffFormSchema>;

interface StaffFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff?: Staff | null;
  onSuccess?: () => void;
}

const roleLabels: Record<RoleType, string> = {
  doctor: 'Médico',
  nurse: 'Enfermeiro',
  admin: 'Administrador',
  receptionist: 'Recepcionista',
  pharmacist: 'Farmacêutico',
  lab_technician: 'Técnico de Laboratório',
};

const statusLabels: Record<StaffStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  ON_LEAVE: 'Em Licença',
};

export function StaffForm({ open, onOpenChange, staff, onSuccess }: StaffFormProps) {
  const isEditing = !!staff;

  const form = useForm<StaffFormData>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      role: 'nurse',
      specialization: '',
      phone: '',
      email: '',
      hireDate: '',
      status: 'ACTIVE',
    },
  });

  // Preencher form quando editar
  useEffect(() => {
    if (staff && open) {
      form.reset({
        firstName: staff.firstName,
        lastName: staff.lastName,
        role: staff.role,
        specialization: staff.specialization || '',
        phone: staff.phone || '',
        email: staff.email || '',
        hireDate: staff.hireDate || '',
        status: staff.status,
      });
    } else if (!open) {
      // Limpar form ao fechar
      form.reset({
        firstName: '',
        lastName: '',
        role: 'nurse',
        specialization: '',
        phone: '',
        email: '',
        hireDate: '',
        status: 'ACTIVE',
      });
    }
  }, [staff, open, form]);

  const onSubmit = async (data: StaffFormData) => {
    try {
      // Remove email vazio (backend pode rejeitar string vazia)
      const payload = {
        ...data,
        email: data.email || undefined,
        specialization: data.specialization || undefined,
        phone: data.phone || undefined,
        hireDate: data.hireDate || undefined,
      };

      if (isEditing && staff) {
        await staffService.update(staff.id, payload);
        toast.success('Profissional atualizado com sucesso');
      } else {
        await staffService.create(payload);
        toast.success('Profissional cadastrado com sucesso');
      }

      onOpenChange(false);
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao salvar profissional:', error);
      const message = error.response?.data?.message || 'Erro ao salvar profissional';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Profissional' : 'Novo Profissional'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize os dados do profissional'
              : 'Cadastre um novo membro da equipe'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Nome */}
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="João" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sobrenome */}
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sobrenome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Função */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a função" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(roleLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Especialização */}
            <FormField
              control={form.control}
              name="specialization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialização</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Cardiologia, Clínico Geral, etc"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Telefone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(11) 98765-4321"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="joao.silva@hospital.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Data de Contratação */}
            <FormField
              control={form.control}
              name="hireDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Contratação</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? 'Salvando...'
                  : isEditing
                  ? 'Atualizar'
                  : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
