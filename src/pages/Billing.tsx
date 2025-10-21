import { DollarSign } from "lucide-react";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";

export default function Billing() {
  return (
    <PlaceholderPage
      title="Faturamento"
      description="Gestão de contas e faturamento"
      icon={DollarSign}
      features={[
        "Gerar contas de atendimento",
        "Integração com convênios (TISS)",
        "Controlar pagamentos",
        "Emitir notas fiscais",
        "Relatórios financeiros",
        "Glosas e pendências"
      ]}
    />
  );
}
