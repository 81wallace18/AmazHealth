import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';
import type { ActivateAccountRequest } from '@/services/authService';
import { toast } from 'sonner';

const activateSchema = z
  .object({
    token: z.string().uuid('Token inválido'),
    password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmPassword'],
  });

type ActivateFormValues = ActivateAccountRequest;

export default function ActivateAccount() {
  const location = useLocation();
  const navigate = useNavigate();
  const { loading } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const urlToken = searchParams.get('token') || '';

  const form = useForm<ActivateFormValues>({
    resolver: zodResolver(activateSchema),
    defaultValues: {
      token: urlToken,
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (urlToken) {
      form.setValue('token', urlToken);
    }
  }, [urlToken, form]);

  const onSubmit = async (values: ActivateFormValues) => {
    try {
      const response = await authService.activateAccount(values);

      // Persistir tokens e usuário via hook de auth
      localStorage.setItem('accessToken', response.accessToken);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      localStorage.setItem('user', JSON.stringify({
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        fullName: response.user.fullName,
        organizationId: response.user.organizationId,
        organizationName: response.user.organizationName,
        staffId: response.user.staffId ?? null,
        activeSectorId: response.user.activeSectorId ?? null,
        roles: response.user.roles ?? [],
      }));

      toast.success('Conta ativada com sucesso! Você já está logado.');
      navigate('/', { replace: true });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'Não foi possível ativar a conta. Verifique o token ou tente novamente.';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Ativar Conta</CardTitle>
          <CardDescription>
            Defina sua senha para concluir a ativação da conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token de Ativação</FormLabel>
                    <FormControl>
                      <Input placeholder="Cole aqui o token recebido" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading || form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Ativando...' : 'Ativar Conta'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
