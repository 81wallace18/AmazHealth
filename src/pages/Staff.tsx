import { Users } from "lucide-react";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";

export default function Staff() {
  return (
    <PlaceholderPage
      title="Equipe"
      description="Gerenciamento da equipe médica e de enfermagem"
      icon={Users}
      features={[
        "Cadastrar profissionais de saúde",
        "Gerenciar especialidades",
        "Controlar escalas de trabalho",
        "Vincular a setores",
        "Registros profissionais (CRM, COREN)",
        "Relatórios de produtividade"
      ]}
    />
  );
}
