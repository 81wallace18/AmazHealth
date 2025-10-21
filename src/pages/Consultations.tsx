import { Stethoscope } from "lucide-react";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";

export default function Consultations() {
  return (
    <PlaceholderPage
      title="Consultas"
      description="Atendimentos médicos em andamento"
      icon={Stethoscope}
      features={[
        "Iniciar atendimento médico",
        "Registrar anamnese",
        "Solicitar exames",
        "Prescrever medicamentos",
        "Definir conduta (alta/internação)",
        "Gerar atestados e receitas"
      ]}
    />
  );
}
