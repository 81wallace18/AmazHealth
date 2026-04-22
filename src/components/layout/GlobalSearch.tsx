import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, FileText, Stethoscope } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { patientService } from '@/services/patientService';

interface SearchResult {
  id: string;
  type: 'patient' | 'attendance';
  title: string;
  subtitle: string;
  url: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const search = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await patientService.search({ search: term, page: 0, size: 8 });
      const patients: SearchResult[] = (data.content || []).slice(0, 8).map((p: any) => ({
        id: p.id,
        type: 'patient' as const,
        title: `${p.firstName} ${p.lastName}`,
        subtitle: p.patientCode || p.email || '',
        url: `/patients`,
      }));
      setResults(patients);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    search(value);
  };

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery('');
    setResults([]);
    navigate(result.url);
  };

  return (
    <>
      <div
        className="relative min-w-0 max-w-md flex-1 cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar pacientes..."
          className="pl-10 cursor-pointer"
          readOnly
          aria-label="Busca global"
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Busca Global</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite nome, codigo ou CPF..."
                className="pl-10"
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                autoFocus
              />
            </div>

            <div className="max-h-64 overflow-y-auto">
              {loading && (
                <p className="text-sm text-muted-foreground text-center py-4">Buscando...</p>
              )}
              {!loading && query.length >= 2 && results.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum resultado</p>
              )}
              {!loading && query.length < 2 && (
                <p className="text-sm text-muted-foreground text-center py-4">Digite pelo menos 2 caracteres</p>
              )}
              {results.map((result) => (
                <button
                  key={result.id}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-accent transition-colors"
                  onClick={() => handleSelect(result)}
                >
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{result.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
