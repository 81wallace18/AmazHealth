import { Calendar } from "lucide-react";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";

export default function Appointments() {
  return (
    <PlaceholderPage
      title="Agendamentos"
      description="Gerenciamento de consultas e agendamentos"
      icon={Calendar}
      features={[
        "Agendar consultas para pacientes",
        "Visualizar agenda dos profissionais",
        "Gerenciar horários disponíveis",
        "Enviar lembretes automáticos",
        "Cancelar e reagendar consultas",
        "Relatórios de agendamentos"
      ]}
    />
  );
}
