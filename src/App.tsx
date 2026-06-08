import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { queryClient, persistOptions } from "./lib/persistedQueryClient";
import { AppLayout } from "./components/layout/AppLayout";
import { useAuth } from "./hooks/useAuth";
import { RequireCapability } from "./components/RequireCapability";
import { RequireRole } from "./components/RequireRole";
import { RequireAccess } from "./components/RequireAccess";
import { RequirePermission } from "./components/RequirePermission";
import type { UserRole } from "./auth/capabilities";
import Dashboard from "./pages/Dashboard";
import GestoraDashboard from "./pages/GestoraDashboard";
import Hospital from "./pages/Hospital";
import Consultations from "./pages/Consultations";
import Patients from "./pages/Patients";
import Appointments from "./pages/Appointments";
import MedicalRecords from "./pages/MedicalRecords";
import Admissions from "./pages/Admissions";
import Laboratory from "./pages/Laboratory";
import Pharmacy from "./pages/Pharmacy";
import LmeCeaf from "./pages/LmeCeaf";
import Billing from "./pages/Billing";
import Reports from "./pages/Reports";
import Staff from "./pages/Staff";
import UserManagement from "./pages/UserManagement";
import Triage from "./pages/Triage";
import ReceptionTriage from "./pages/ReceptionTriage";
import DailyAttendances from "./pages/DailyAttendances";
import Auth from "./pages/Auth";
import ActivateAccount from "./pages/ActivateAccount";
import DutyManagement from "./pages/DutyManagement";
import NightShiftReview from "./pages/NightShiftReview";
import SyncQueue from "./pages/SyncQueue";
import PecReviewBoard from "./pages/PecReviewBoard";
import PecShiftClosing from "./pages/PecShiftClosing";
import MyPecConnection from "./pages/MyPecConnection";
import NotFound from "./pages/NotFound";
import { Unauthorized } from "./pages/Unauthorized";
import ChangePassword from "./pages/ChangePassword";

const ALL_SYNC_QUEUE_ROLES: UserRole[] = [
  "ADMIN",
  "GESTAO",
  "DOCTOR",
  "NURSE",
  "NURSE_MANAGER",
  "NURSE_TECHNICIAN",
  "PHARMACIST",
  "RECEPTIONIST",
  "HOSPITAL_MANAGER",
  "FINANCE",
  "PLATFORM_ADMIN",
  "PLATFORM_SUPPORT",
  "TENANT_ADMIN",
  "TENANT_MANAGER",
];

function RouteLoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm text-center">
        <div
          className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-primary/20 border-t-primary"
          role="status"
          aria-label="Carregando contexto da sessão"
        />
        <p className="mt-4 text-sm font-medium text-foreground">Carregando contexto</p>
        <p className="mt-1 text-sm text-muted-foreground">Verificando sessão, permissões e unidade ativa.</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <RouteLoadingState />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <RouteLoadingState />;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

const App = () => (
  <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
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
          <Route path="/change-password" element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          } />
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="gestora-dashboard" element={
              <RequireAccess allowedRoles={["ADMIN", "GESTAO", "NURSE_MANAGER", "HOSPITAL_MANAGER"]} module="URGENCIA">
                <GestoraDashboard />
              </RequireAccess>
            } />
            <Route path="daily-attendances" element={
              <RequireAccess allowedRoles={["ADMIN", "GESTAO", "DOCTOR", "NURSE", "NURSE_MANAGER", "NURSE_TECHNICIAN", "RECEPTIONIST", "HOSPITAL_MANAGER"]} module="URGENCIA">
                <DailyAttendances />
              </RequireAccess>
            } />
            <Route path="hospital" element={
              <RequireAccess allowedRoles={["ADMIN", "GESTAO", "NURSE_MANAGER", "HOSPITAL_MANAGER"]} module="INTERNACAO">
                <Hospital />
              </RequireAccess>
            } />
            <Route path="consultations" element={
              <RequireCapability capability="canStartAttendance">
                <Consultations />
              </RequireCapability>
            } />
            <Route path="patients" element={
              <RequireCapability capability="canReadPatients">
                <Patients />
              </RequireCapability>
            } />
            <Route path="appointments" element={
              <RequireAccess allowedRoles={["ADMIN"]} module="AMBULATORIAL">
                <Appointments />
              </RequireAccess>
            } />
            <Route path="medical-records" element={
              <RequireAccess allowedRoles={["DOCTOR", "NURSE", "NURSE_TECHNICIAN", "PLATFORM_ADMIN"]} module="URGENCIA">
                <RequirePermission permission={{ resource: "PRONTUARIO", action: "READ", context: { sector: "URGENCIA", patientRelationship: "UNDER_CARE", mode: "ROUTINE", shareGrant: "NONE" } }}>
                  <MedicalRecords />
                </RequirePermission>
              </RequireAccess>
            } />
            <Route path="triage" element={
              <RequirePermission permission={{ resource: "TRIAGEM", action: "READ_BOARD", context: { sector: "URGENCIA", duty: "ACTIVE" } }}>
                <Triage />
              </RequirePermission>
            } />
            <Route path="reception/triage" element={
              <RequireAccess allowedRoles={["ADMIN", "RECEPTIONIST", "NURSE", "NURSE_MANAGER"]} module="URGENCIA">
                <RequirePermission permission={{ resource: "RECEPCAO", action: "OPEN_ATTENDANCE", context: { sector: "URGENCIA" } }}>
                  <ReceptionTriage />
                </RequirePermission>
              </RequireAccess>
            } />
            <Route path="admissions" element={
              <RequireAccess allowedRoles={["ADMIN", "HOSPITAL_MANAGER"]} module="INTERNACAO">
                <Admissions />
              </RequireAccess>
            } />
            <Route path="laboratory" element={
              <RequireCapability capabilities={["canRequestExams", "canInputExamResults", "canReadExamResults"]}>
                <Laboratory />
              </RequireCapability>
            } />
            <Route path="pharmacy" element={
              <RequireAccess allowedRoles={["ADMIN", "PHARMACIST"]} module="FARMACIA">
                <Pharmacy />
              </RequireAccess>
            } />
            <Route path="lme-ceaf" element={
              <RequireAccess allowedRoles={["ADMIN", "GESTAO", "HOSPITAL_MANAGER", "DOCTOR", "PHARMACIST", "PLATFORM_ADMIN"]}>
                <LmeCeaf />
              </RequireAccess>
            } />
            <Route path="billing" element={
              <RequireAccess allowedRoles={["ADMIN", "FINANCE"]} module="FATURAMENTO">
                <Billing />
              </RequireAccess>
            } />
            <Route path="reports" element={
              <RequireAccess allowedRoles={["ADMIN", "GESTAO", "NURSE_MANAGER", "HOSPITAL_MANAGER", "FINANCE"]} module="RELATORIOS">
                <Reports />
              </RequireAccess>
            } />
            <Route path="staff" element={
              <RequireAccess allowedRoles={["ADMIN", "GESTAO", "HOSPITAL_MANAGER"]}>
                <Staff />
              </RequireAccess>
            } />
            <Route path="users" element={
              <RequireAccess allowedRoles={["ADMIN", "HOSPITAL_MANAGER"]}>
                <UserManagement />
              </RequireAccess>
            } />
            <Route path="duties" element={
              <RequireAccess allowedRoles={["ADMIN", "NURSE_MANAGER", "PLATFORM_ADMIN"]} module="URGENCIA" policy="night_shift_review">
                <RequireCapability capability="canManageDuties">
                  <DutyManagement />
                </RequireCapability>
              </RequireAccess>
            } />
            <Route path="night-shift-review" element={
              <RequireAccess allowedRoles={["DOCTOR", "NURSE_MANAGER", "PLATFORM_ADMIN"]} module="URGENCIA" policy="night_shift_review">
                <RequireCapability capability="canReviewNightActions">
                  <NightShiftReview />
                </RequireCapability>
              </RequireAccess>
            } />
            <Route path="sync-queue" element={
              <RequireRole allowedRoles={ALL_SYNC_QUEUE_ROLES}>
                <SyncQueue />
              </RequireRole>
            } />
            <Route path="pec-shift-closing" element={
              <RequireAccess allowedRoles={["ADMIN", "GESTAO", "NURSE", "NURSE_MANAGER", "NURSE_TECHNICIAN"]} module="URGENCIA" integration="ESUS_PEC">
                <PecShiftClosing />
              </RequireAccess>
            } />
            <Route path="pec-review-board" element={
              <RequireAccess allowedRoles={["ADMIN", "GESTAO", "HOSPITAL_MANAGER"]} module="URGENCIA" integration="ESUS_PEC">
                <PecReviewBoard />
              </RequireAccess>
            } />
            <Route path="minha-conexao-externa" element={
              <RequireAccess allowedRoles={["ADMIN", "GESTAO", "NURSE", "NURSE_MANAGER", "NURSE_TECHNICIAN", "PHARMACIST", "DOCTOR", "HOSPITAL_MANAGER"]}>
                <MyPecConnection />
              </RequireAccess>
            } />
            <Route path="minha-conexao-pec" element={
              <RequireAccess allowedRoles={["ADMIN", "GESTAO", "NURSE", "NURSE_MANAGER", "NURSE_TECHNICIAN", "PHARMACIST", "DOCTOR", "HOSPITAL_MANAGER"]}>
                <MyPecConnection />
              </RequireAccess>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          </Route>
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </PersistQueryClientProvider>
);

export default App;
