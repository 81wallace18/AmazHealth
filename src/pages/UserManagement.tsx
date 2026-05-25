import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, PauseCircle, Plus, Power, RefreshCw, Shield, Trash2, UserCog, XCircle, Link as LinkIcon } from "lucide-react";
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
import externalIdentityService from "@/services/externalIdentityService";
import { PageResponse, RoleType, User } from "@/types/user";
import {
  ExternalIdentityLink,
  ExternalIdentityLinkStatus,
  ExternalIdentityProvider,
} from "@/types/externalIdentity";
import { useAuth } from "@/hooks/useAuth";

const createUserSchema = z.object({
  fullName: z.string().min(1, "Nome completo é obrigatório"),
  email: z.string().email("Email inválido").or(z.literal("")).optional(),
  cpf: z.string().optional(),
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

const PROVIDER_LABELS: Record<ExternalIdentityProvider, string> = {
  HORUS_LEGACY: "Hórus legado",
  ESUS_PEC: "e-SUS PEC",
  ESUS_AF: "e-SUS AF",
};

const LINK_STATUS_LABELS: Record<ExternalIdentityLinkStatus, string> = {
  PRE_REGISTERED: "Pré-cadastrado",
  PENDING_APPROVAL: "Aguardando aprovação",
  APPROVED: "Aprovado",
  SUSPENDED: "Suspenso",
  REJECTED: "Rejeitado",
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
  const [externalLinks, setExternalLinks] = useState<ExternalIdentityLink[]>([]);
  const [externalProviderFilter, setExternalProviderFilter] = useState<ExternalIdentityProvider | "ALL">("ALL");
  const [externalStatusFilter, setExternalStatusFilter] = useState<ExternalIdentityLinkStatus | "ALL">("PENDING_APPROVAL");
  const [externalLoading, setExternalLoading] = useState(false);
  const [syncingExternal, setSyncingExternal] = useState(false);
  const [approvalDrafts, setApprovalDrafts] = useState<Record<string, { userId?: string; staffId?: string }>>({});
  const [activationInfo, setActivationInfo] = useState<{
    email: string;
    activationUrl?: string;
    activationToken?: string;
    tempPassword?: string;
  } | null>(null);

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: "",
      email: "",
      cpf: "",
      role: "staff",
    },
  });

  const isAdmin = user?.roles?.includes("ADMIN") || user?.roles?.includes("admin") || user?.roles?.includes("HOSPITAL_MANAGER");
  const users = data?.content ?? [];
  const approvableUsers = users.filter((item) => item.staffId);

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

  const loadExternalLinks = async () => {
    try {
      setExternalLoading(true);
      const links = await externalIdentityService.list({
        provider: externalProviderFilter === "ALL" ? undefined : externalProviderFilter,
        status: externalStatusFilter === "ALL" ? undefined : externalStatusFilter,
      });
      setExternalLinks(links);
    } catch (error: any) {
      const message = error?.response?.data?.message || "Erro ao carregar vínculos externos.";
      toast.error(message);
    } finally {
      setExternalLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
      loadExternalLinks();
    }
  }, [isAdmin, externalProviderFilter, externalStatusFilter]);

  const onCreateUser = async (values: CreateUserFormValues) => {
    try {
      setCreating(true);
      const response = await userService.create(values);
      setActivationInfo({
        email: response.email,
        activationToken: response.activationToken,
        activationUrl: response.activationUrl,
        tempPassword: response.tempPassword,
      });
      toast.success(response.tempPassword
        ? "Profissional criado. Entregue a senha temporária pessoalmente."
        : "Usuário criado. Compartilhe o link de ativação.");
      form.reset({ fullName: "", email: "", cpf: "", role: "staff" });
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

  const handleApproveExternalLink = async (link: ExternalIdentityLink) => {
    const draft = approvalDrafts[link.id] ?? {};
    const userId = draft.userId?.trim() || link.userId || undefined;
    const staffId = draft.staffId?.trim() || link.staffId || undefined;
    if (!userId || !staffId) {
      toast.error("Selecione o usuário/profissional interno antes de aprovar este vínculo.");
      return;
    }
    try {
      await externalIdentityService.approve(link.id, {
        userId,
        staffId,
        statusReason: "Aprovado pela gestão na tela de usuários.",
      });
      toast.success("Vínculo externo aprovado.");
      await loadExternalLinks();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Não foi possível aprovar o vínculo.");
    }
  };

  const handleReviewExternalLink = async (
    link: ExternalIdentityLink,
    action: "reject" | "suspend"
  ) => {
    try {
      if (action === "reject") {
        await externalIdentityService.reject(link.id, {
          statusReason: "Revisado pela gestão na tela de usuários.",
        });
        toast.success("Vínculo externo rejeitado.");
      } else {
        await externalIdentityService.suspend(link.id, {
          statusReason: "Suspenso pela gestão na tela de usuários.",
        });
        toast.success("Vínculo externo suspenso.");
      }
      await loadExternalLinks();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Não foi possível revisar o vínculo.");
    }
  };

  const handleSyncNow = async () => {
    try {
      setSyncingExternal(true);
      const summary = await externalIdentityService.syncNow({
        provider: externalProviderFilter === "ALL" ? undefined : externalProviderFilter,
        limit: 25,
      });
      toast.success(`Sincronização processada: ${summary.succeeded ?? 0} sucesso(s), ${summary.failed ?? 0} falha(s).`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Não foi possível sincronizar agora.");
    } finally {
      setSyncingExternal(false);
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
                  <Label htmlFor="email">Email <span className="text-muted-foreground text-xs">(opcional)</span></Label>
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
                  <Label htmlFor="cpf">CPF <span className="text-muted-foreground text-xs">(opcional — permite login por CPF)</span></Label>
                  <Input
                    id="cpf"
                    {...form.register("cpf")}
                    placeholder="000.000.000-00"
                  />
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
                  <p className="text-sm font-medium text-green-700">Profissional criado com sucesso!</p>
                  {activationInfo.tempPassword ? (
                    <>
                      <p className="text-xs text-muted-foreground">
                        Entregue a senha temporária abaixo pessoalmente. O profissional precisará trocá-la no primeiro acesso.
                      </p>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <code className="px-3 py-2 rounded bg-amber-50 border border-amber-200 text-amber-800 font-mono text-sm font-bold flex-1 text-center tracking-widest">
                            {activationInfo.tempPassword}
                          </code>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(activationInfo.tempPassword!);
                              toast.success("Senha copiada!");
                            }}
                          >
                            Copiar
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
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
                              navigator.clipboard.writeText(activationInfo.activationUrl!);
                              toast.success("Link copiado!");
                            }}
                          >
                            Copiar Link
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
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

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Identidades externas
            </CardTitle>
            <CardDescription>
              Revise vínculos criados por login Hórus/PEC/AF e acione sincronização manual quando necessário.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={externalProviderFilter} onValueChange={(value) => setExternalProviderFilter(value as ExternalIdentityProvider | "ALL")}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={externalStatusFilter} onValueChange={(value) => setExternalStatusFilter(value as ExternalIdentityLinkStatus | "ALL")}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os status</SelectItem>
                {Object.entries(LINK_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadExternalLinks} disabled={externalLoading}>
              {externalLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Atualizar
            </Button>
            <Button variant="secondary" onClick={handleSyncNow} disabled={syncingExternal}>
              {syncingExternal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Sincronizar agora
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {externalLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              <span>Carregando vínculos externos...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Login externo</TableHead>
                  <TableHead>Documentos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vínculo interno</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {externalLinks.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell>{PROVIDER_LABELS[link.provider] ?? link.provider}</TableCell>
                    <TableCell className="font-medium">{link.externalLogin || "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {[link.externalCpf && `CPF ${link.externalCpf}`, link.externalCns && `CNS ${link.externalCns}`].filter(Boolean).join(" / ") || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={link.status === "APPROVED" ? "default" : link.status === "REJECTED" ? "destructive" : "secondary"}>
                        {LINK_STATUS_LABELS[link.status] ?? link.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="min-w-64 space-y-2 text-xs text-muted-foreground">
                      <Select
                        value={approvalDrafts[link.id]?.staffId ?? link.staffId ?? ""}
                        onValueChange={(staffId) => {
                          const selected = approvableUsers.find((item) => item.staffId === staffId);
                          setApprovalDrafts((current) => ({
                            ...current,
                            [link.id]: {
                              userId: selected?.id,
                              staffId,
                            },
                          }));
                        }}
                        disabled={link.status === "APPROVED"}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Selecionar profissional interno" />
                        </SelectTrigger>
                        <SelectContent>
                          {approvableUsers.map((item) => {
                            const role = item.organizations?.[0]?.role ?? "staff";
                            return (
                              <SelectItem key={item.staffId} value={item.staffId!}>
                                {item.fullName || item.username} · {ROLE_LABELS[role] ?? role}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <div>
                        {approvalDrafts[link.id]?.staffId || link.staffId
                          ? "Profissional selecionado para vínculo local"
                          : "Selecione o profissional local correspondente"}
                      </div>
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleApproveExternalLink(link)}
                        disabled={link.status === "APPROVED"}
                        title="Aprovar vínculo"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleReviewExternalLink(link, "suspend")}
                        disabled={link.status === "SUSPENDED" || link.status === "REJECTED"}
                        title="Suspender vínculo"
                      >
                        <PauseCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleReviewExternalLink(link, "reject")}
                        disabled={link.status === "REJECTED"}
                        title="Rejeitar vínculo"
                      >
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!externalLinks.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      Nenhum vínculo externo encontrado para os filtros atuais.
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
