import { Search, X, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PatientFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  genderFilter: string;
  setGenderFilter: (gender: string) => void;
  dateOfBirthFilter?: string;
  setDateOfBirthFilter?: (date: string) => void;
  onClearFilters?: () => void;
}

export function PatientFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  genderFilter,
  setGenderFilter,
  dateOfBirthFilter,
  setDateOfBirthFilter,
  onClearFilters
}: PatientFiltersProps) {
  const hasActiveFilters = () => {
    return (
      searchTerm !== '' ||
      statusFilter !== 'all' ||
      genderFilter !== 'all' ||
      (dateOfBirthFilter && dateOfBirthFilter !== '')
    );
  };

  const activeFilterCount = () => {
    let count = 0;
    if (searchTerm !== '') count++;
    if (statusFilter !== 'all') count++;
    if (genderFilter !== 'all') count++;
    if (dateOfBirthFilter && dateOfBirthFilter !== '') count++;
    return count;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Filtros</CardTitle>
            {hasActiveFilters() && (
              <Badge variant="secondary">
                <Filter className="h-3 w-3 mr-1" />
                {activeFilterCount()} ativo{activeFilterCount() > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          {hasActiveFilters() && onClearFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-8 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Limpar Filtros
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Linha 1: Busca */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou cartão SUS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Linha 2: Filtros adicionais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="deceased">Falecido</SelectItem>
              </SelectContent>
            </Select>

            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Gênero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Gêneros</SelectItem>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Feminino</SelectItem>
                <SelectItem value="Other">Outro</SelectItem>
              </SelectContent>
            </Select>

            {setDateOfBirthFilter && (
              <div className="space-y-1">
                <Input
                  type="date"
                  value={dateOfBirthFilter || ''}
                  onChange={(e) => setDateOfBirthFilter(e.target.value)}
                  placeholder="Data de Nascimento"
                />
              </div>
            )}

            <div className="flex items-center text-sm text-muted-foreground">
              {!hasActiveFilters() ? (
                <span>Use os filtros para refinar a busca</span>
              ) : (
                <span className="text-primary font-medium">
                  Filtrando resultados
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}