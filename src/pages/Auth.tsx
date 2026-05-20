import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { knownUsers, KnownUser } from '@/lib/knownUsers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft, UserPlus, X } from 'lucide-react';

const loginSchema = z.object({
  login: z.string().min(1, 'Email ou username é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
  organizationId: z.string().optional(),
  rememberMe: z.boolean().optional(),
});

type LoginValues = z.infer<typeof loginSchema>;

type Mode = 'picker' | 'login';

export default function Auth() {
  const { signIn, loading } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<KnownUser[]>(() => knownUsers.list());
  const [mode, setMode] = useState<Mode>(() => (knownUsers.list().length > 0 ? 'picker' : 'login'));
  const [selectedUser, setSelectedUser] = useState<KnownUser | null>(null);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      login: '',
      password: '',
      organizationId: '',
      rememberMe: false,
    },
  });

  // Quando seleciona usuário do picker, pré-preenche o login e foca no campo senha.
  useEffect(() => {
    if (selectedUser) {
      loginForm.setValue('login', selectedUser.login);
      loginForm.setValue('password', '');
      loginForm.setValue('rememberMe', true);
      loginForm.clearErrors();
      const t = setTimeout(() => {
        document.querySelector<HTMLInputElement>('input[name="password"]')?.focus();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [selectedUser, loginForm]);

  const onLogin = async (values: LoginValues) => {
    loginForm.clearErrors('root');
    const { error, message, mustChangePassword } = await signIn(
      values.login,
      values.password,
      values.organizationId,
      values.rememberMe
    );
    if (!error) {
      navigate(mustChangePassword ? '/change-password' : '/', { replace: true });
    } else if (message) {
      loginForm.setError('root', { message });
    }
  };

  const handlePickUser = (user: KnownUser) => {
    setSelectedUser(user);
    setMode('login');
  };

  const handleAddNew = () => {
    setSelectedUser(null);
    loginForm.reset({ login: '', password: '', organizationId: '', rememberMe: false });
    setMode('login');
  };

  const handleForget = (login: string, ev: React.MouseEvent) => {
    ev.stopPropagation();
    knownUsers.forget(login);
    const remaining = knownUsers.list();
    setUsers(remaining);
    if (remaining.length === 0) {
      setMode('login');
    }
  };

  const handleBackToPicker = () => {
    setSelectedUser(null);
    loginForm.reset({ login: '', password: '', organizationId: '', rememberMe: false });
    setMode('picker');
  };

  if (mode === 'picker') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Quem está usando?</CardTitle>
            <CardDescription>
              Selecione seu perfil pra entrar com sua senha, ou adicione outro usuário.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {users.map((user) => (
                <UserTile
                  key={user.login}
                  user={user}
                  onClick={() => handlePickUser(user)}
                  onForget={(ev) => handleForget(user.login, ev)}
                />
              ))}
              <button
                onClick={handleAddNew}
                className="group flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-card p-4 transition-colors hover:border-primary hover:bg-accent"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground">
                  <UserPlus className="h-8 w-8" />
                </div>
                <span className="text-sm font-medium">Outro usuário</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          {selectedUser ? (
            <>
              <div className="flex justify-start">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToPicker}
                  className="-ml-2 text-muted-foreground"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Trocar usuário
                </Button>
              </div>
              <div className="flex justify-center">
                <Avatar initials={selectedUser.initials ?? '?'} size="lg" />
              </div>
              <CardTitle className="text-2xl font-bold">
                {selectedUser.fullName ?? selectedUser.login}
              </CardTitle>
              {selectedUser.organizationName && (
                <CardDescription>{selectedUser.organizationName}</CardDescription>
              )}
            </>
          ) : (
            <>
              {users.length > 0 && (
                <div className="flex justify-start">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToPicker}
                    className="-ml-2 text-muted-foreground"
                  >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Voltar
                  </Button>
                </div>
              )}
              <CardTitle className="text-2xl font-bold">Sistema Hospitalar</CardTitle>
              <CardDescription>Acesso para profissionais de saúde</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              {!selectedUser && (
                <FormField
                  control={loginForm.control}
                  name="login"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email, Username ou CPF</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="email, username ou CPF"
                          autoFocus
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••"
                        autoComplete="current-password"
                        {...field}
                      />
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
              {!selectedUser && (
                <div className="text-xs text-muted-foreground">
                  Acesso por convite. Solicite ao gestor da unidade caso ainda não tenha acesso.
                </div>
              )}
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

function UserTile({
  user,
  onClick,
  onForget,
}: {
  user: KnownUser;
  onClick: () => void;
  onForget: (ev: React.MouseEvent) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      className="group relative flex flex-col items-center gap-2 rounded-lg border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
      aria-label={`Selecionar usuário ${user.fullName ?? user.login}`}
    >
      <button
        type="button"
        onClick={onForget}
        title="Esquecer este usuário neste dispositivo"
        className="absolute right-1 top-1 rounded-full bg-background p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>
      <Avatar initials={user.initials ?? '?'} size="md" />
      <div className="text-center">
        <div className="line-clamp-1 text-sm font-semibold">{user.fullName ?? user.login}</div>
        {user.organizationName && (
          <div className="line-clamp-1 text-xs text-muted-foreground">{user.organizationName}</div>
        )}
      </div>
    </div>
  );
}

function Avatar({ initials, size }: { initials: string; size: 'sm' | 'md' | 'lg' }) {
  const dim =
    size === 'lg'
      ? 'h-20 w-20 text-2xl'
      : size === 'md'
      ? 'h-16 w-16 text-xl'
      : 'h-10 w-10 text-base';
  const palette = useMemo(
    () => [
      'bg-rose-500',
      'bg-amber-500',
      'bg-emerald-500',
      'bg-sky-500',
      'bg-violet-500',
      'bg-fuchsia-500',
      'bg-teal-500',
    ],
    []
  );
  const hash = initials.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const color = palette[hash % palette.length];
  return (
    <div className={`flex items-center justify-center rounded-full font-bold text-white ${color} ${dim}`}>
      {initials}
    </div>
  );
}
