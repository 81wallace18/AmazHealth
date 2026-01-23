import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AppLayout } from "./components/layout/AppLayout";
import { useAuth } from "./hooks/useAuth";
import { useSessionTimeout } from "./hooks/useSessionTimeout";
import { AUTH_LOGOUT_EVENT } from "./lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Dashboard from "./pages/Dashboard";
import Hospital from "./pages/Hospital";
import Consultations from "./pages/Consultations";
import Patients from "./pages/Patients";
import Triage from "./pages/Triage";
import Appointments from "./pages/Appointments";
import MedicalRecords from "./pages/MedicalRecords";
import Admissions from "./pages/Admissions";
import Laboratory from "./pages/Laboratory";
import Pharmacy from "./pages/Pharmacy";
import Billing from "./pages/Billing";
import Reports from "./pages/Reports";
import Staff from "./pages/Staff";
import UserManagement from "./pages/UserManagement";
import FacilityManagement from "./pages/FacilityManagement";
import BedManagement from "./pages/BedManagement";
import Auth from "./pages/Auth";
import ActivateAccount from "./pages/ActivateAccount";
import NotFound from "./pages/NotFound";
import ReceptionTriage from "./pages/ReceptionTriage";
import ReceptionQueue from "./pages/ReceptionQueue";

const queryClient = new QueryClient();

function AuthListener() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  // Timeout de sessão automático (15 minutos de inatividade)
  const { showWarning, resetTimer, timeLeftMs } = useSessionTimeout({
    timeout: 60 * 60 * 1000, // 60 minutos
    warningTime: 5 * 60 * 1000,  // Avisa 5 minutos antes
    onTimeout: () => {
      signOut({
        silent: true,
        reason: 'Sessão expirada por inatividade. Faça login novamente.',
        redirectTo: '/auth',
      });
    },
  });

  const minutes = Math.floor(timeLeftMs / 60000);
  const seconds = Math.floor((timeLeftMs % 60000) / 1000);
  const countdownLabel = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  useEffect(() => {
    const handleLogout = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[App] Logout automático detectado:', customEvent.detail);
      toast.error('Sessão expirada. Faça login novamente.');
      navigate('/auth', { replace: true });
    };

    window.addEventListener(AUTH_LOGOUT_EVENT, handleLogout);

    return () => {
      window.removeEventListener(AUTH_LOGOUT_EVENT, handleLogout);
    };
  }, [navigate]);

  return (
    <AlertDialog open={showWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sessão expirando</AlertDialogTitle>
          <AlertDialogDescription>
            Você ficará desconectado em {countdownLabel} por inatividade. Clique em
            continuar para manter a sessão ativa.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={resetTimer}>Continuar sessão</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Verifica se o usuário tem role ADMIN
  if (!user?.roles?.includes('ADMIN')) {
    toast.error('Acesso negado', {
      description: 'Esta página é restrita a administradores.',
    });
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function RoleRoute({
  children,
  allowedRoles,
  redirectTo = "/",
}: {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const hasAccess = allowedRoles.some((role) => user?.roles?.includes(role));
  if (!hasAccess) {
    toast.error('Acesso negado', {
      description: 'Você não tem permissão para acessar esta página.',
    });
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

const NON_RECEPTION_ROLES = ['ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST', 'STAFF'];

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthListener />
        <Routes>
          <Route path="/auth" element={
            <PublicRoute>
              <Auth />
            </PublicRoute>
          } />
          <Route path="/activate" element={
            <PublicRoute>
              <ActivateAccount />
            </PublicRoute>
          } />
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={
              <RoleRoute allowedRoles={NON_RECEPTION_ROLES} redirectTo="/patients">
                <Dashboard />
              </RoleRoute>
            } />
            <Route path="hospital" element={
              <RoleRoute allowedRoles={NON_RECEPTION_ROLES} redirectTo="/patients">
                <Hospital />
              </RoleRoute>
            } />
            <Route path="consultations" element={
              <RoleRoute allowedRoles={NON_RECEPTION_ROLES} redirectTo="/patients">
                <Consultations />
              </RoleRoute>
            } />
            <Route path="patients" element={<Patients />} />
            <Route path="triage" element={
              <RoleRoute allowedRoles={NON_RECEPTION_ROLES} redirectTo="/patients">
                <Triage />
              </RoleRoute>
            } />
            <Route path="appointments" element={<Appointments />} />
            <Route path="medical-records" element={
              <RoleRoute allowedRoles={NON_RECEPTION_ROLES} redirectTo="/patients">
                <MedicalRecords />
              </RoleRoute>
            } />
            <Route path="admissions" element={
              <RoleRoute allowedRoles={NON_RECEPTION_ROLES} redirectTo="/patients">
                <Admissions />
              </RoleRoute>
            } />
            <Route path="laboratory" element={
              <RoleRoute allowedRoles={NON_RECEPTION_ROLES} redirectTo="/patients">
                <Laboratory />
              </RoleRoute>
            } />
            <Route path="pharmacy" element={
              <RoleRoute allowedRoles={NON_RECEPTION_ROLES} redirectTo="/patients">
                <Pharmacy />
              </RoleRoute>
            } />
            <Route path="billing" element={
              <RoleRoute allowedRoles={NON_RECEPTION_ROLES} redirectTo="/patients">
                <Billing />
              </RoleRoute>
            } />
            <Route path="reports" element={
              <RoleRoute allowedRoles={NON_RECEPTION_ROLES} redirectTo="/patients">
                <Reports />
              </RoleRoute>
            } />
            <Route path="staff" element={
              <RoleRoute allowedRoles={NON_RECEPTION_ROLES} redirectTo="/patients">
                <Staff />
              </RoleRoute>
            } />
            <Route path="users" element={
              <RoleRoute allowedRoles={NON_RECEPTION_ROLES} redirectTo="/patients">
                <UserManagement />
              </RoleRoute>
            } />
            <Route path="reception/triage" element={
              <RoleRoute allowedRoles={['ADMIN', 'RECEPTIONIST']} redirectTo="/patients">
                <ReceptionTriage />
              </RoleRoute>
            } />
            <Route path="reception/queue" element={
              <RoleRoute allowedRoles={['ADMIN', 'RECEPTIONIST']} redirectTo="/patients">
                <ReceptionQueue />
              </RoleRoute>
            } />
            <Route path="facilities" element={
              <AdminRoute>
                <FacilityManagement />
              </AdminRoute>
            } />
            <Route path="beds" element={
              <AdminRoute>
                <BedManagement />
              </AdminRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
