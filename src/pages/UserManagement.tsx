import { useEffect, useState } from "react";
import { Plus, UserCog, Shield, Power, Trash2, Loader2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { userService } from "@/services/userService";
import { PageResponse, RoleType, User } from "@/types/user";
import { useAuth } from "@/hooks/useAuth";

const createUserSchema = z.object({
  fullName: z.string().min(1, "Nome completo é obrigatório"),
  email: z.string().email("Email inválido"),
  role: z.enum([
    "admin",
    "gestao",
    "doctor",
    "nurse",
    "nurse_manager",
    "pharmacist",
    "receptionist",
    "hospital_manager",
    "finance",
    "staff",
  ]),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

const ROLE_LABELS: Record<RoleType, string> = {
  admin: "Administrador",
  gestao: "Gestão",
  doctor: "Médico",
  nurse: "Enfermeiro",
  nurse_manager: "Coord. Enfermagem",
  pharmacist: "Farmacêutico",
  receptionist: "Recepcionista",
  hospital_manager: "Gestão Hospitalar",
  finance: "Financeiro",
  staff: "Funcionário",
};

function roleToBadgeVariant(role: RoleType): "default" | "secondary" | "outline" | "destructive" {
  switch (role) {
    case "admin":
      return "destructive";
    case "gestao":
    case "hospital_manager":
      return "secondary";
    case "doctor":
      return "default";
    case "nurse":
    case "nurse_manager":
    case "pharmacist":
      return "secondary";
    case "finance":
      return "outline";
    default:
      return "outline";
  }
}

export default function UserManagement() {
  const { user } = useAuth();
  const [data, setData] = useState<PageResponse<User> | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activationInfo, setActivationInfo] = useState<{
    email: string;
    activationUrl: string;
    activationToken: string;
  } | null>(null);

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: "",
      email: "",
      role: "staff",
    },
  });

  const isAdmin = user?.roles?.includes("ADMIN") || user?.roles?.includes("admin");

  const loadUsers = async () => {
    try {
      setLoading(true);
      const page = await userService.findAll(0, 50);
      setData(page);
    } catch (error: any) {
      const message = error?.response?.data?.message || "Erro ao carregar usuários.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const onCreateUser = async (values: CreateUserFormValues) => {
    try {
      setCreating(true);
      const response = await userService.create(values);
      setActivationInfo({
        email: response.email,
        activationToken: response.activationToken,
        activationUrl: response.activationUrl,
      });
      toast.success("Usuário criado com sucesso. Compartilhe o link de ativação.");
      form.reset({ fullName: "", email: "", role: "staff" });
      await loadUsers();
    } catch (error: any) {
      const message = error?.response?.data?.message || "Erro ao criar usuário.";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (userEntity: User) => {
    try {
      const updated = await userService.updateStatus(userEntity.id, {
        isActive: !userEntity.isActive,
      });
      toast.success(updated.isActive ? "Usuário ativado." : "Usuário desativado.");
      await loadUsers();
    } catch (error: any) {
      const message = error?.response?.data?.message || "Não foi possível alterar o status do usuário.";
      toast.error(message);
    }
  };

  const handleRemoveUser = async (userEntity: User) => {
    try {
      await userService.removeFromOrganization(userEntity.id);
      toast.success("Usuário removido da organização.");
      await loadUsers();
    } catch (error: any) {
      const message = error?.response?.data?.message || "Não foi possível remover o usuário.";
      toast.error(message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Acesso restrito
            </CardTitle>
            <CardDescription>
              Apenas administradores podem gerenciar usuários e permissões.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Usuários & Acessos
            </CardTitle>
            <CardDescription>
              Crie contas de acesso, gerencie permissões e controle quem pode usar o sistema.
            </CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar novo usuário</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={form.handleSubmit(onCreateUser)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome completo</Label>
                  <Input
                    id="fullName"
                    {...form.register("fullName")}
                    placeholder="Nome do profissional"
                  />
                  {form.formState.errors.fullName && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.fullName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    placeholder="profissional@hospital.com"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Perfil</Label>
                  <Select
                    value={form.watch("role")}
                    onValueChange={(value) =>
                      form.setValue("role", value as CreateUserFormValues["role"])
                    }
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        [
                          "admin",
                          "gestao",
                          "doctor",
                          "nurse",
                          "nurse_manager",
                          "pharmacist",
                          "receptionist",
                          "hospital_manager",
                          "finance",
                          "staff",
                        ] as RoleType[]
                      ).map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.role && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.role.message}
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={creating}>
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      "Criar usuário"
                    )}
                  </Button>
                </DialogFooter>
              </form>
              {activationInfo && (
                <div className="mt-4 space-y-3 border-t pt-4">
                  <p className="text-sm font-medium text-green-700">Usuário criado com sucesso!</p>
                  <p className="text-xs text-muted-foreground">
                    Envie o link abaixo para o profissional criar a senha e ativar a conta.
                  </p>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-semibold">Email:</span> {activationInfo.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 rounded bg-muted text-xs flex-1 truncate">
                        {activationInfo.activationUrl}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(activationInfo.activationUrl);
                          toast.success("Link copiado!");
                        }}
                      >
                        Copiar Link
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Carregando usuários...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último login</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.content?.map((u) => {
                  const orgRole = u.organizations[0];
                  const role = orgRole?.role ?? "staff";
                  return (
                    <TableRow
                      key={u.id}
                      className={selectedUser?.id === u.id ? "bg-muted/50" : undefined}
                    >
                      <TableCell className="font-medium">
                        {u.fullName || u.username}
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={roleToBadgeVariant(role)}>
                          {ROLE_LABELS[role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.isActive ? "default" : "outline"}>
                          {u.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.lastLogin
                          ? new Date(u.lastLogin).toLocaleString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleToggleActive(u)}
                          title={u.isActive ? "Desativar usuário" : "Ativar usuário"}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => setSelectedUser(u)}
                          title="Selecionar usuário"
                        >
                          <LinkIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveUser(u)}
                          title="Remover da organização"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!data?.content?.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
