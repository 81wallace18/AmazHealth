import { FileText } from "lucide-react";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";

export default function MedicalRecords() {
  return (
    <PlaceholderPage
      title="Prontuários"
      description="Prontuários eletrônicos dos pacientes"
      icon={FileText}
      features={[
        "Visualizar histórico médico completo",
        "Registrar evoluções e anotações",
        "Anexar exames e documentos",
        "Buscar por CID/diagnósticos",
        "Imprimir prontuário",
        "Controle de acesso por perfil"
      ]}
    />
  );
}
