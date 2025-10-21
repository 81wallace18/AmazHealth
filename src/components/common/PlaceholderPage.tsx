import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  features?: string[];
}

export function PlaceholderPage({
  title,
  description,
  icon: Icon = Construction,
  features
}: PlaceholderPageProps) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Icon className="h-8 w-8" />
          {title}
        </h1>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Módulo em Desenvolvimento</AlertTitle>
        <AlertDescription>
          Este módulo será implementado após a conclusão do backend correspondente.
          {features && features.length > 0 && (
            <span> As seguintes funcionalidades estão planejadas:</span>
          )}
        </AlertDescription>
      </Alert>

      {features && features.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Funcionalidades Planejadas</CardTitle>
            <CardDescription>
              O que você poderá fazer quando este módulo estiver completo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
        <div className="text-center text-muted-foreground">
          <Construction className="h-12 w-12 mx-auto mb-4" />
          <p className="text-lg font-semibold">Aguardando Implementação Backend</p>
          <p className="text-sm">
            Esta funcionalidade será ativada assim que os endpoints estiverem prontos
          </p>
        </div>
      </div>
    </div>
  );
}
