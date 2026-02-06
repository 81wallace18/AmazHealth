import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HomeIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <HomeIcon className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Acesso Negado
          </CardTitle>
          <CardDescription>
            Você não tem permissão para acessar esta página ou função.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Entre em contato com o administrador do sistema se precisar de acesso a este recurso.
            </p>
            <Button
              onClick={() => navigate('/')}
              className="w-full"
            >
              Voltar para o Início
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
