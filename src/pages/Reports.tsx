import { BarChart3 } from "lucide-react";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";

export default function Reports() {
  return (
    <PlaceholderPage
      title="Relatórios"
      description="Relatórios e indicadores do sistema"
      icon={BarChart3}
      features={[
        "Relatórios de atendimentos",
        "Indicadores de qualidade",
        "Estatísticas de ocupação",
        "Produtividade da equipe",
        "Tempo porta-médico",
        "Exportar para PDF/Excel"
      ]}
    />
  );
}
