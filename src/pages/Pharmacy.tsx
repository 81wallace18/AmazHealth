import { Pill } from "lucide-react";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";

export default function Pharmacy() {
  return (
    <PlaceholderPage
      title="Farmácia"
      description="Gestão farmacêutica e estoque"
      icon={Pill}
      features={[
        "Receber prescrições médicas",
        "Dispensar medicamentos",
        "Controlar estoque por lote/validade",
        "Gerenciar medicamentos controlados",
        "Alertas de vencimento",
        "Relatórios de consumo"
      ]}
    />
  );
}
