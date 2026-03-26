import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const loginSchema = z.object({
  login: z.string().min(1, 'Email ou username é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
  organizationId: z.string().optional(),
  rememberMe: z.boolean().optional(),
});

export default function Auth() {
  const { signIn, loading } = useAuth();
  const navigate = useNavigate();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      login: '',
      password: '',
      organizationId: '',
      rememberMe: false,
    },
  });

  const onLogin = async (values: z.infer<typeof loginSchema>) => {
    loginForm.clearErrors('root');
    const { error, message } = await signIn(
      values.login,
      values.password,
      values.organizationId,
      values.rememberMe
    );
    if (!error) {
      navigate('/');
    } else if (message) {
      loginForm.setError('root', { message });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Sistema Hospitalar</CardTitle>
          <CardDescription>
            Acesso para profissionais de saúde
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="login"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email ou Username</FormLabel>
                    <FormControl>
                      <Input placeholder="seu.email@exemplo.com ou username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loginForm.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">
                      Permanecer conectado neste dispositivo
                    </FormLabel>
                  </FormItem>
                )}
              />
              {loginForm.formState.errors.root?.message && (
                <Alert variant="destructive">
                  <AlertDescription>{loginForm.formState.errors.root.message}</AlertDescription>
                </Alert>
              )}
              <div className="text-xs text-muted-foreground">
                Acesso por convite. Solicite ao gestor da unidade caso ainda não tenha acesso.
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
