import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { icdService } from '@/services/icdService';
import type { IcdSearchResult, IcdSystem } from '@/types/icd';

interface DiagnosisPickerProps {
  system: IcdSystem;
  onSystemChange: (system: IcdSystem) => void;
  onSelect: (item: IcdSearchResult) => void;
}

const SYSTEM_LABELS: Record<IcdSystem, string> = {
  ICD10: 'CID-10',
  ICD11: 'CID-11',
};

export function DiagnosisPicker({ system, onSystemChange, onSelect }: DiagnosisPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IcdSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (query.trim().length < 3) return;
    setIsSearching(true);
    setError(null);
    try {
      const data = await icdService.search(query, system);
      setResults(data);
    } catch (err) {
      setError(`Não foi possível buscar ${SYSTEM_LABELS[system]}.`);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    setResults([]);
    setError(null);
  }, [system]);

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      void handleSearch();
    }, 500);
    return () => clearTimeout(timeout);
  }, [query, system]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2">
        <Select value={system} onValueChange={(value) => onSystemChange(value as IcdSystem)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SYSTEM_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Input
            placeholder="Digite termo ou codigo (min. 3 caracteres)"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), handleSearch())}
          />
          <Button type="button" variant="secondary" onClick={handleSearch} disabled={isSearching}>
            {isSearching ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {results.length > 0 && (
        <div className="border rounded-md p-2 space-y-2 max-h-48 overflow-y-auto">
          {results.map((item) => (
            <div key={`${item.system}-${item.code}`} className="flex items-center justify-between gap-2 text-sm">
              <div>
                <div className="font-semibold">{item.code}</div>
                <div className="text-muted-foreground">{item.description}</div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  onSelect(item);
                  setResults([]);
                }}
              >
                Usar
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
