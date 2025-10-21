import { BedDouble } from "lucide-react";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";

export default function Admissions() {
  return (
    <PlaceholderPage
      title="Internação"
      description="Gerenciamento de leitos e internações"
      icon={BedDouble}
      features={[
        "Solicitar leito para paciente",
        "Visualizar mapa de leitos",
        "Gerenciar transferências",
        "Controlar ocupação (UTI/enfermaria)",
        "Registrar alta hospitalar",
        "Relatórios de ocupação"
      ]}
    />
  );
}
