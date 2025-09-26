import { useState } from "react";
import { useForm } from "react-hook-form";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Loader2 } from "lucide-react";

interface StaffFormData {
  first_name: string;
  last_name: string;
  role: string;
  specialization?: string;
  phone?: string;
  email?: string;
  hire_date: string;
  status: string;
}

interface StaffFormProps {
  onSubmit: (data: StaffFormData) => Promise<void>;
  loading?: boolean;
}

const roles = [
  "Médico",
  "Enfermeiro",
  "Técnico de Enfermagem",
  "Fisioterapeuta",
  "Nutricionista",
  "Farmacêutico",
  "Administrativo",
  "Segurança",
  "Limpeza",
  "Manutenção"
];

const specializations = [
  "Cardiologia",
  "Neurologia",
  "Pediatria",
  "Ortopedia",
  "Ginecologia",
  "Urologia",
  "Dermatologia",
  "Oncologia",
  "Psiquiatria",
  "UTI",
  "Emergência",
  "Cirurgia Geral"
];

export function StaffForm({ onSubmit, loading = false }: StaffFormProps) {
  const [selectedRole, setSelectedRole] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<StaffFormData>();

  const watchedRole = watch("role");

  const onFormSubmit = async (data: StaffFormData) => {
    await onSubmit(data);
  };

  const shouldShowSpecialization = () => {
    return watchedRole === "Médico" || watchedRole === "Enfermeiro" || watchedRole === "Fisioterapeuta";
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Cadastrar Novo Funcionário
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Nome *</Label>
                <Input
                  id="first_name"
                  {...register("first_name", { required: "Nome é obrigatório" })}
                  placeholder="Digite o nome"
                />
                {errors.first_name && (
                  <p className="text-sm text-destructive">{errors.first_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Sobrenome *</Label>
                <Input
                  id="last_name"
                  {...register("last_name", { required: "Sobrenome é obrigatório" })}
                  placeholder="Digite o sobrenome"
                />
                {errors.last_name && (
                  <p className="text-sm text-destructive">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Cargo *</Label>
                <Select onValueChange={(value) => setValue("role", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-destructive">{errors.role.message}</p>
                )}
              </div>

              {shouldShowSpecialization() && (
                <div className="space-y-2">
                  <Label htmlFor="specialization">Especialização</Label>
                  <Select onValueChange={(value) => setValue("specialization", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a especialização" />
                    </SelectTrigger>
                    <SelectContent>
                      {specializations.map((spec) => (
                        <SelectItem key={spec} value={spec}>
                          {spec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="exemplo@hospital.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hire_date">Data de Contratação *</Label>
                <Input
                  id="hire_date"
                  type="date"
                  {...register("hire_date", { required: "Data de contratação é obrigatória" })}
                />
                {errors.hire_date && (
                  <p className="text-sm text-destructive">{errors.hire_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select onValueChange={(value) => setValue("status", value)} defaultValue="active">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="vacation">Férias</SelectItem>
                    <SelectItem value="leave">Licença</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-destructive">{errors.status.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="submit"
            disabled={loading}
            className="min-w-32"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cadastrando...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Cadastrar Funcionário
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}