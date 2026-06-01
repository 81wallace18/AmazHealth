import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  PauseCircle,
  Plus,
  Power,
  RefreshCw,
  Shield,
  Trash2,
  UserCheck,
  UserCog,
  XCircle,
  Link as LinkIcon,
} from "lucide-react";
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
    "nurse_technician",
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
  nurse_technician: "Téc. Enfermagem",
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

function maskExternalLogin(value?: string | null) {
  const raw = value?.trim();
  if (!raw) return "-";
  if (raw.includes("@")) {
    const [name, domain] = raw.split("@");
    return `${name.slice(0, 2)}***@${domain}`;
  }
  if (raw.length <= 4) return raw;
  return `${raw.slice(0, 3)}***${raw.slice(-2)}`;
}

function isPendingExternalStatus(status: ExternalIdentityLinkStatus) {
  return status === "PENDING_APPROVAL" || status === "PRE_REGISTERED";
}

function externalAccessState(link: ExternalIdentityLink, hasDraftStaff: boolean) {
  if (link.status === "APPROVED") return "Aprovado";
  if (link.status === "SUSPENDED") return "Suspenso";
  if (link.status === "REJECTED") return "Rejeitado";
  return hasDraftStaff ? "Pronto para aprovar" : "Aguardando profissional";
}

type ExternalApprovalMode = "existing" | "new";

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
  const [approvalModes, setApprovalModes] = useState<Record<string, ExternalApprovalMode>>({});
  const [newProfessionalDrafts, setNewProfessionalDrafts] = useState<Record<string, { role: RoleType }>>({});
  const [approvingExternalLinkIds, setApprovingExternalLinkIds] = useState<Set<string>>(() => new Set());
  const [lastExternalApproval, setLastExternalApproval] = useState<{
    provider: ExternalIdentityProvider;
    externalLogin?: string | null;
    createdNewProfessional: boolean;
  } | null>(null);
  const [externalApprovalError, setExternalApprovalError] = useState<string | null>(null);
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
  const pendingExternalLinks = useMemo(
    () => externalLinks.filter((link) => isPendingExternalStatus(link.status)),
    [externalLinks]
  );
  const pendingLinksByUserId = useMemo(() => {
    const index = new Map<string, ExternalIdentityLink[]>();
    pendingExternalLinks.forEach((link) => {
      if (!link.userId) return;
      index.set(link.userId, [...(index.get(link.userId) ?? []), link]);
    });
    return index;
  }, [pendingExternalLinks]);
  const [selectedExternalLinkId, setSelectedExternalLinkId] = useState<string | null>(null);
  const selectedExternalLink = useMemo(() => (
    externalLinks.find((link) => link.id === selectedExternalLinkId)
      ?? pendingExternalLinks[0]
      ?? externalLinks[0]
      ?? null
  ), [externalLinks, pendingExternalLinks, selectedExternalLinkId]);
  const selectedDraft = selectedExternalLink ? approvalDrafts[selectedExternalLink.id] : undefined;
  const selectedApprovalMode: ExternalApprovalMode = selectedExternalLink
    ? approvalModes[selectedExternalLink.id] ?? "existing"
    : "existing";
  const selectedNewProfessionalDraft = selectedExternalLink
    ? newProfessionalDrafts[selectedExternalLink.id] ?? { role: "nurse_technician" as RoleType }
    : { role: "nurse_technician" as RoleType };
  const selectedStaffId = selectedDraft?.staffId ?? selectedExternalLink?.staffId ?? "";
  const selectedStaffUser = selectedStaffId
    ? approvableUsers.find((item) => item.staffId === selectedStaffId)
    : undefined;
  const selectedLinkUser = selectedExternalLink?.userId
    ? users.find((item) => item.id === selectedExternalLink.userId)
    : undefined;

  useEffect(() => {
    if (!selectedExternalLinkId && pendingExternalLinks.length > 0) {
      setSelectedExternalLinkId(pendingExternalLinks[0].id);
    }
  }, [pendingExternalLinks, selectedExternalLinkId]);

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

  const markExternalLinkApproved = (approved: ExternalIdentityLink, createdNewProfessional: boolean) => {
    setExternalLinks((current) => {
      if (externalStatusFilter === "ALL" || externalStatusFilter === "APPROVED") {
        return current.map((item) => (item.id === approved.id ? approved : item));
      }
      return current.filter((item) => item.id !== approved.id);
    });
    setApprovalDrafts((current) => {
      const next = { ...current };
      delete next[approved.id];
      return next;
    });
    setApprovalModes((current) => {
      const next = { ...current };
      delete next[approved.id];
      return next;
    });
    setNewProfessionalDrafts((current) => {
      const next = { ...current };
      delete next[approved.id];
      return next;
    });
    setSelectedExternalLinkId((current) => (current === approved.id ? null : current));
    setLastExternalApproval({
      provider: approved.provider,
      externalLogin: approved.externalLogin,
      createdNewProfessional,
    });
  };

  const handleApproveExternalLink = async (link: ExternalIdentityLink) => {
    if (approvingExternalLinkIds.has(link.id)) return;
    setLastExternalApproval(null);
    setExternalApprovalError(null);
    setApprovingExternalLinkIds((current) => new Set(current).add(link.id));
    const mode = approvalModes[link.id] ?? "existing";
    if (mode === "new") {
      const draft = newProfessionalDrafts[link.id] ?? { role: "nurse_technician" as RoleType };
      try {
        const approved = await externalIdentityService.approveWithNewProfessional(link.id, {
          role: draft.role,
          statusReason: "Aprovado pela gestão com cadastro pessoal pendente.",
        });
        markExternalLinkApproved(approved, true);
        toast.success(`${PROVIDER_LABELS[link.provider] ?? link.provider} aprovado. O acesso foi criado e o cadastro pessoal ficou pendente.`);
        await loadExternalLinks();
        await loadUsers();
      } catch (error: any) {
        const message = error?.response?.data?.message || "Não foi possível criar e aprovar o acesso.";
        setExternalApprovalError(message);
        toast.error(message);
      } finally {
        setApprovingExternalLinkIds((current) => {
          const next = new Set(current);
          next.delete(link.id);
          return next;
        });
      }
      return;
    }

    const draft = approvalDrafts[link.id] ?? {};
    const userId = draft.userId?.trim() || link.userId || undefined;
    const staffId = draft.staffId?.trim() || link.staffId || undefined;
    if (!userId || !staffId) {
      const message = "Selecione o usuário/profissional interno antes de aprovar este vínculo.";
      setExternalApprovalError(message);
      toast.error(message);
      setApprovingExternalLinkIds((current) => {
        const next = new Set(current);
        next.delete(link.id);
        return next;
      });
      return;
    }
    try {
      const approved = await externalIdentityService.approve(link.id, {
        userId,
        staffId,
        statusReason: "Aprovado pela gestão na tela de usuários.",
      });
      markExternalLinkApproved(approved, false);
      toast.success(`${PROVIDER_LABELS[link.provider] ?? link.provider} aprovado. O profissional já pode entrar pelo acesso externo.`);
      await loadExternalLinks();
      await loadUsers();
    } catch (error: any) {
      const message = error?.response?.data?.message || "Não foi possível aprovar o vínculo.";
      setExternalApprovalError(message);
      toast.error(message);
    } finally {
      setApprovingExternalLinkIds((current) => {
        const next = new Set(current);
        next.delete(link.id);
        return next;
      });
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
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Acessos externos pendentes
            </CardTitle>
            <CardDescription>
              Libere logins PEC, Hórus e e-SUS AF vinculando cada acesso ao profissional interno correto.
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
            <Button variant="outline" onClick={loadExternalLinks} disabled={externalLoading}>
              {externalLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {lastExternalApproval && (
            <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-700" />
                <div>
                  <p className="font-medium">
                    Acesso {PROVIDER_LABELS[lastExternalApproval.provider] ?? lastExternalApproval.provider} aprovado.
                  </p>
                  <p className="mt-1">
                    {maskExternalLogin(lastExternalApproval.externalLogin)} já pode tentar entrar com a credencial externa.
                    {lastExternalApproval.createdNewProfessional ? " O cadastro pessoal ficou pendente para completar depois." : ""}
                  </p>
                </div>
              </div>
            </div>
          )}
          {externalApprovalError && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <div>
                  <p className="font-medium">A aprovação não foi concluída.</p>
                  <p className="mt-1">{externalApprovalError}</p>
                </div>
              </div>
            </div>
          )}
          {externalLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              <span>Carregando solicitações de acesso...</span>
            </div>
          ) : pendingExternalLinks.length ? (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.9fr)]">
              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Login</TableHead>
                      <TableHead>Situação</TableHead>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Pendência</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingExternalLinks.map((link) => {
                      const draft = approvalDrafts[link.id];
                      const mode = approvalModes[link.id] ?? "existing";
                      const staffId = draft?.staffId ?? link.staffId ?? "";
                      const staffUser = staffId ? approvableUsers.find((item) => item.staffId === staffId) : undefined;
                      const state = mode === "new" ? "Criar acesso" : externalAccessState(link, Boolean(staffId));
                      const approving = approvingExternalLinkIds.has(link.id);
                      return (
                        <TableRow
                          key={link.id}
                          className={selectedExternalLink?.id === link.id ? "bg-muted/50" : undefined}
                          onClick={() => setSelectedExternalLinkId(link.id)}
                        >
                          <TableCell className="font-medium">
                            {PROVIDER_LABELS[link.provider] ?? link.provider}
                          </TableCell>
                          <TableCell>{maskExternalLogin(link.externalLogin)}</TableCell>
                          <TableCell>
                            <Badge variant={staffId ? "secondary" : "outline"}>
                              {state}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-48 truncate">
                            {mode === "new" ? "Novo profissional" : staffUser?.fullName || staffUser?.username || "Não selecionado"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {mode === "new" ? "Perfil e aprovar" : staffId ? "Conferir e aprovar" : "Selecionar profissional interno"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant={staffId || mode === "new" ? "default" : "outline"}
                              disabled={approving}
                              onClick={(event) => {
                                event.stopPropagation();
                                if (staffId || mode === "new") {
                                  handleApproveExternalLink(link);
                                } else {
                                  setSelectedExternalLinkId(link.id);
                                }
                              }}
                            >
                              {approving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              {staffId || mode === "new" ? "Aprovar acesso" : "Resolver"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="rounded-md border bg-muted/20 p-4">
                {selectedExternalLink ? (
                  <div className="space-y-4">
                    {approvingExternalLinkIds.has(selectedExternalLink.id) && (
                      <div className="rounded-md border bg-background p-3 text-sm">
                        <div className="flex items-center gap-2 font-medium">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Aprovando acesso externo...
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Aguarde a confirmação do sistema. A solicitação sairá da fila quando a aprovação for gravada.
                        </p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold">Aprovar acesso {PROVIDER_LABELS[selectedExternalLink.provider] ?? selectedExternalLink.provider}</h3>
                        <Badge variant="outline">{LINK_STATUS_LABELS[selectedExternalLink.status]}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Confirme o profissional interno antes de liberar o login externo.
                      </p>
                    </div>

                    <div className="grid gap-3 text-sm">
                      <div className="rounded-md border bg-background p-3">
                        <div className="mb-1 flex items-center gap-2 font-medium">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Login externo autenticado
                        </div>
                        <div className="text-muted-foreground">
                          {maskExternalLogin(selectedExternalLink.externalLogin)}
                        </div>
                      </div>

                      <div className="rounded-md border bg-background p-3">
                        <Label className="mb-2 block text-xs font-semibold">Como liberar este acesso</Label>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Button
                            type="button"
                            variant={selectedApprovalMode === "existing" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setApprovalModes((current) => ({ ...current, [selectedExternalLink.id]: "existing" }))}
                          >
                            Vincular existente
                          </Button>
                          <Button
                            type="button"
                            variant={selectedApprovalMode === "new" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setApprovalModes((current) => ({ ...current, [selectedExternalLink.id]: "new" }))}
                          >
                            Criar novo acesso
                          </Button>
                        </div>

                        {selectedApprovalMode === "existing" ? (
                          <div className="mt-3">
                            <Select
                              value={selectedStaffId}
                              onValueChange={(staffId) => {
                                const selected = approvableUsers.find((item) => item.staffId === staffId);
                                setApprovalDrafts((current) => ({
                                  ...current,
                                  [selectedExternalLink.id]: {
                                    userId: selected?.id,
                                    staffId,
                                  },
                                }));
                              }}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Selecionar profissional correspondente" />
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
                            <p className="mt-2 text-xs text-muted-foreground">
                              Use quando o profissional já existe no AmazHealth.
                            </p>
                          </div>
                        ) : (
                          <div className="mt-3 space-y-2">
                            <Label className="block text-xs font-semibold">Perfil operacional</Label>
                            <Select
                              value={selectedNewProfessionalDraft.role}
                              onValueChange={(role) => {
                                setNewProfessionalDrafts((current) => ({
                                  ...current,
                                  [selectedExternalLink.id]: { role: role as RoleType },
                                }));
                              }}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Selecionar perfil" />
                              </SelectTrigger>
                              <SelectContent>
                                {(["nurse_technician", "nurse", "doctor", "pharmacist", "receptionist", "staff"] as RoleType[]).map((role) => (
                                  <SelectItem key={role} value={role}>
                                    {ROLE_LABELS[role] ?? role}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              O acesso será liberado agora. Os dados pessoais ficam pendentes para o profissional completar no primeiro acesso.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="rounded-md border bg-background p-3">
                        <div className="mb-2 flex items-center gap-2 font-medium">
                          <Shield className="h-4 w-4 text-primary" />
                          Conferência antes da liberação
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-start gap-2">
                            {selectedApprovalMode === "new" || selectedStaffUser ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" /> : <Clock3 className="mt-0.5 h-4 w-4 text-muted-foreground" />}
                            <span>{selectedApprovalMode === "new" ? "Novo acesso profissional será criado." : selectedStaffUser ? "Profissional interno selecionado." : "Selecione o profissional interno correspondente."}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            {selectedApprovalMode === "new" || selectedStaffUser ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" /> : <AlertCircle className="mt-0.5 h-4 w-4 text-muted-foreground" />}
                            <span>{selectedApprovalMode === "new" ? "Cadastro pessoal ficará pendente para completar depois." : selectedStaffUser ? "Conta interna com papel profissional disponível." : "A liberação precisa de uma conta interna com papel profissional."}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                            <span>O acesso externo será auditado como vínculo aprovado.</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        className="flex-1"
                        disabled={approvingExternalLinkIds.has(selectedExternalLink.id) || (selectedApprovalMode === "existing" && !selectedStaffId)}
                        onClick={() => handleApproveExternalLink(selectedExternalLink)}
                      >
                        {approvingExternalLinkIds.has(selectedExternalLink.id)
                          ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        {selectedApprovalMode === "new"
                          ? "Criar acesso e aprovar"
                          : `Aprovar acesso ${selectedExternalLink.provider === "ESUS_PEC" ? "PEC" : "externo"}`}
                      </Button>
                      <Button variant="outline" onClick={() => handleReviewExternalLink(selectedExternalLink, "reject")}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Rejeitar
                      </Button>
                    </div>

                    {selectedLinkUser && (
                      <p className="text-xs text-muted-foreground">
                        Conta local criada: {selectedLinkUser.username}. Ela só deve ser usada depois do vínculo externo aprovado.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex h-full min-h-64 items-center justify-center text-center text-sm text-muted-foreground">
                    Selecione uma solicitação para revisar os dados do acesso.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-dashed py-8 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-primary" />
              <p className="text-sm font-medium">Nenhum acesso externo pendente.</p>
              <p className="text-xs text-muted-foreground">Novas tentativas de login PEC, Hórus ou e-SUS AF aparecem aqui para aprovação.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Usuários internos
            </CardTitle>
            <CardDescription>
              Crie contas locais e acompanhe papéis internos. Acesso externo pendente deve ser resolvido na fila acima.
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
                          "nurse_technician",
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
                  const pendingLinksForUser = pendingLinksByUserId.get(u.id) ?? [];
                  const hasPendingExternalAccess = pendingLinksForUser.length > 0;
                  return (
                    <TableRow
                      key={u.id}
                      className={selectedUser?.id === u.id ? "bg-muted/50" : undefined}
                    >
                      <TableCell className="space-y-1 font-medium">
                        <div>{u.fullName || u.username}</div>
                        {hasPendingExternalAccess && (
                          <div className="flex flex-wrap gap-1">
                            {pendingLinksForUser.map((link) => (
                              <Badge key={link.id} variant="outline" className="text-[11px]">
                                Criado por {PROVIDER_LABELS[link.provider] ?? link.provider}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={roleToBadgeVariant(role)}>
                          {ROLE_LABELS[role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant={u.isActive ? "default" : "outline"}>
                            {u.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                          {hasPendingExternalAccess && (
                            <div className="text-xs text-muted-foreground">
                              Aguardando aprovação de acesso externo
                            </div>
                          )}
                        </div>
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
                          disabled={!u.isActive && hasPendingExternalAccess}
                          title={
                            !u.isActive && hasPendingExternalAccess
                              ? "Resolva a solicitação externa antes de ativar a conta local"
                              : u.isActive ? "Desativar usuário" : "Ativar usuário"
                          }
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            if (hasPendingExternalAccess) {
                              setSelectedExternalLinkId(pendingLinksForUser[0].id);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            } else {
                              setSelectedUser(u);
                            }
                          }}
                          title={hasPendingExternalAccess ? "Resolver solicitação externa" : "Selecionar usuário"}
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
