import { Search, UserPlus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PatientsEmptyStateProps {
  hasFilters: boolean;
  onClearFilters?: () => void;
  onAddPatient?: () => void;
}

/**
 * EmptyState exibido quando não há pacientes (US-A1)
 * Mostra mensagens diferentes conforme o contexto:
 * - Se há filtros ativos: sugere limpar filtros
 * - Se não há filtros: sugere cadastrar novo paciente
 */
export function PatientsEmptyState({
  hasFilters,
  onClearFilters,
  onAddPatient
}: PatientsEmptyStateProps) {
  if (hasFilters) {
    // Busca sem resultados
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 px-6">
          <div className="rounded-full bg-muted p-6 mb-6">
            <Search className="h-12 w-12 text-muted-foreground" />
          </div>

          <h3 className="text-2xl font-semibold mb-2">
            Nenhum paciente encontrado
          </h3>

          <p className="text-muted-foreground text-center max-w-md mb-6">
            Não encontramos pacientes com os filtros aplicados.
            Tente ajustar os critérios de busca ou limpar todos os filtros.
          </p>

          <div className="flex gap-3">
            {onClearFilters && (
              <Button
                onClick={onClearFilters}
                variant="outline"
                size="lg"
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            )}

            {onAddPatient && (
              <Button
                onClick={onAddPatient}
                size="lg"
                className="bg-primary hover:bg-primary/90"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Cadastrar Novo Paciente
              </Button>
            )}
          </div>

          <div className="mt-8 text-sm text-muted-foreground">
            <p className="font-medium mb-2">💡 Dicas de busca:</p>
            <ul className="list-disc list-inside space-y-1 text-left">
              <li>Tente buscar por nome, CPF ou Cartão SUS</li>
              <li>Verifique se não há erros de digitação</li>
              <li>Use filtros menos restritivos</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sem pacientes cadastrados
  return (
    <Card className="border-2 border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 px-6">
        <div className="rounded-full bg-primary/10 p-6 mb-6">
          <UserPlus className="h-12 w-12 text-primary" />
        </div>

        <h3 className="text-2xl font-semibold mb-2">
          Nenhum paciente cadastrado
        </h3>

        <p className="text-muted-foreground text-center max-w-md mb-6">
          Comece cadastrando o primeiro paciente do sistema.
          O cadastro é rápido e você poderá iniciar os atendimentos imediatamente.
        </p>

        {onAddPatient && (
          <Button
            onClick={onAddPatient}
            size="lg"
            className="bg-primary hover:bg-primary/90"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Cadastrar Primeiro Paciente
          </Button>
        )}

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 max-w-md">
          <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
            📋 Campos obrigatórios:
          </p>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-inside list-disc">
            <li>Nome completo</li>
            <li>Data de nascimento</li>
            <li>Gênero</li>
            <li>Nome da mãe</li>
            <li>CPF ou Cartão SUS</li>
            <li>Raça/Cor</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
