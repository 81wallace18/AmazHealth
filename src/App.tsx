import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { useAuth } from "./hooks/useAuth";
import { RequireCapability } from "./components/RequireCapability";
import { RequireRole } from "./components/RequireRole";
import Dashboard from "./pages/Dashboard";
import Hospital from "./pages/Hospital";
import Consultations from "./pages/Consultations";
import Patients from "./pages/Patients";
import Appointments from "./pages/Appointments";
import MedicalRecords from "./pages/MedicalRecords";
import Admissions from "./pages/Admissions";
import Laboratory from "./pages/Laboratory";
import Pharmacy from "./pages/Pharmacy";
import Billing from "./pages/Billing";
import Reports from "./pages/Reports";
import Staff from "./pages/Staff";
import UserManagement from "./pages/UserManagement";
import Triage from "./pages/Triage";
import ReceptionTriage from "./pages/ReceptionTriage";
import Auth from "./pages/Auth";
import ActivateAccount from "./pages/ActivateAccount";
import NotFound from "./pages/NotFound";
import { Unauthorized } from "./pages/Unauthorized";

const queryClient = new QueryClient();

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={
            <PublicRoute>
              <Auth />
            </PublicRoute>
          } />
          <Route path="/activate-account" element={
            <PublicRoute>
              <ActivateAccount />
            </PublicRoute>
          } />
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="hospital" element={
              <RequireRole allowedRoles={["ADMIN", "GESTAO", "NURSE_MANAGER", "HOSPITAL_MANAGER"]}>
                <Hospital />
              </RequireRole>
            } />
            <Route path="consultations" element={
              <RequireRole allowedRoles={["ADMIN", "DOCTOR"]}>
                <Consultations />
              </RequireRole>
            } />
            <Route path="patients" element={
              <RequireRole allowedRoles={["ADMIN", "RECEPTIONIST", "NURSE", "NURSE_MANAGER", "DOCTOR"]}>
                <Patients />
              </RequireRole>
            } />
            <Route path="appointments" element={
              <RequireRole allowedRoles={["ADMIN", "RECEPTIONIST"]}>
                <Appointments />
              </RequireRole>
            } />
            <Route path="medical-records" element={
              <RequireRole allowedRoles={["ADMIN", "DOCTOR"]}>
                <MedicalRecords />
              </RequireRole>
            } />
            <Route path="triage" element={
              <RequireRole allowedRoles={["ADMIN", "NURSE", "NURSE_MANAGER"]}>
                <Triage />
              </RequireRole>
            } />
            <Route path="reception/triage" element={
              <RequireRole allowedRoles={["ADMIN", "RECEPTIONIST"]}>
                <ReceptionTriage />
              </RequireRole>
            } />
            <Route path="admissions" element={
              <RequireRole allowedRoles={["ADMIN", "HOSPITAL_MANAGER"]}>
                <Admissions />
              </RequireRole>
            } />
            <Route path="laboratory" element={
              <RequireRole allowedRoles={["ADMIN", "DOCTOR"]}>
                <Laboratory />
              </RequireRole>
            } />
            <Route path="pharmacy" element={
              <RequireRole allowedRoles={["ADMIN", "PHARMACIST"]}>
                <Pharmacy />
              </RequireRole>
            } />
            <Route path="billing" element={
              <RequireRole allowedRoles={["ADMIN", "FINANCE"]}>
                <Billing />
              </RequireRole>
            } />
            <Route path="reports" element={
              <RequireRole allowedRoles={["ADMIN", "GESTAO", "NURSE_MANAGER", "HOSPITAL_MANAGER", "FINANCE"]}>
                <Reports />
              </RequireRole>
            } />
            <Route path="staff" element={
              <RequireRole allowedRoles={["ADMIN", "GESTAO"]}>
                <Staff />
              </RequireRole>
            } />
            <Route path="users" element={
              <RequireRole allowedRoles={["ADMIN"]}>
                <UserManagement />
              </RequireRole>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          </Route>
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
