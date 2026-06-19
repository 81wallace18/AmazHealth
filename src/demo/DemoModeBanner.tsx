import { Badge } from "@/components/ui/badge";
import { isDemoMode } from "./demoMode";

export function DemoModeBanner() {
  if (!isDemoMode()) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50/80 px-4 py-2 text-amber-950">
      <div className="mx-auto flex max-w-screen-2xl items-center gap-2 text-sm">
        <Badge variant="outline" className="border-amber-300 bg-white/70 text-amber-900">
          Modo demonstracao
        </Badge>
        <span className="text-amber-900">
          Dados preenchidos pelo botao de exemplo precisam ser revisados antes do envio manual.
        </span>
      </div>
    </div>
  );
}
