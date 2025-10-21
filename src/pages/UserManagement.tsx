import { UserCog } from "lucide-react";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";

export default function UserManagement() {
  return (
    <PlaceholderPage
      title="Usuários"
      description="Gerenciamento de usuários e permissões"
      icon={UserCog}
      features={[
        "Criar e editar usuários",
        "Definir perfis e permissões (RBAC)",
        "Resetar senhas",
        "Ativar/Desativar contas",
        "Log de acessos",
        "Auditoria de ações"
      ]}
    />
  );
}
