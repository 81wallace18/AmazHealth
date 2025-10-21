import { Building2 } from "lucide-react";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";

export default function Hospital() {
  return (
    <PlaceholderPage
      title="Gestão Hospitalar"
      description="Configurações e gestão do hospital"
      icon={Building2}
      features={[
        "Cadastrar setores e departamentos",
        "Gerenciar especialidades médicas",
        "Configurar horários de funcionamento",
        "Definir protocolos clínicos",
        "Gerenciar equipamentos",
        "Relatórios gerenciais"
      ]}
    />
  );
}
