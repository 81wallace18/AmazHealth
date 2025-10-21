import { FlaskConical } from "lucide-react";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";

export default function Laboratory() {
  return (
    <PlaceholderPage
      title="Laboratório"
      description="Gestão de exames laboratoriais"
      icon={FlaskConical}
      features={[
        "Receber solicitações de exames",
        "Registrar coleta de amostras",
        "Lançar resultados",
        "Imprimir laudos",
        "Controle de qualidade",
        "Interface com equipamentos"
      ]}
    />
  );
}
