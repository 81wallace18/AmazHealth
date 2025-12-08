import { Calendar, AlertCircle } from "lucide-react";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Appointments() {
  return (
    <div className="p-6 space-y-6">
      <Alert variant="default" className="border-blue-200 bg-blue-50 dark:bg-blue-950">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900 dark:text-blue-100">
          <strong>Módulo em Desenvolvimento</strong>
          <br />
          O sistema de agendamentos está planejado para implementação futura.
          Atualmente, o fluxo de atendimento acontece através da recepção com triagem Manchester
          (atendimento por ordem de chegada e gravidade).
        </AlertDescription>
      </Alert>

      <PlaceholderPage
        title="Agendamentos"
        description="Gerenciamento de consultas e agendamentos (Em breve)"
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
    </div>
  );
}
