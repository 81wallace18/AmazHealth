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
import NotFound from "./pages/NotFound";
import { Unauthorized } from "./pages/Unauthorized";
import ChangePassword from "./pages/ChangePassword";

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
              <RequireRole allowedRoles={["ADMIN", "GESTAO", "NURSE_MANAGER", "HOSPITAL_MANAGER"]}>
                <GestoraDashboard />
              </RequireRole>
            } />
            <Route path="daily-attendances" element={
              <RequireRole allowedRoles={["ADMIN", "GESTAO", "DOCTOR", "NURSE", "NURSE_MANAGER", "RECEPTIONIST", "HOSPITAL_MANAGER"]}>
                <DailyAttendances />
              </RequireRole>
            } />
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
              <RequireRole allowedRoles={["ADMIN", "RECEPTIONIST", "NURSE", "NURSE_MANAGER", "DOCTOR", "PHARMACIST", "HOSPITAL_MANAGER"]}>
                <Patients />
              </RequireRole>
            } />
            <Route path="appointments" element={
              <RequireRole allowedRoles={["ADMIN"]}>
                <Appointments />
              </RequireRole>
            } />
            <Route path="medical-records" element={
              <RequireRole allowedRoles={["ADMIN", "DOCTOR", "NURSE", "NURSE_MANAGER"]}>
                <MedicalRecords />
              </RequireRole>
            } />
            <Route path="triage" element={
              <RequireRole allowedRoles={["ADMIN", "NURSE", "NURSE_MANAGER"]}>
                <Triage />
              </RequireRole>
            } />
            <Route path="reception/triage" element={
              <RequireRole allowedRoles={["ADMIN", "RECEPTIONIST", "NURSE", "NURSE_MANAGER"]}>
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
              <RequireRole allowedRoles={["ADMIN", "GESTAO", "HOSPITAL_MANAGER"]}>
                <Staff />
              </RequireRole>
            } />
            <Route path="users" element={
              <RequireRole allowedRoles={["ADMIN"]}>
                <UserManagement />
              </RequireRole>
            } />
            <Route path="duties" element={
              <RequireRole allowedRoles={["ADMIN", "NURSE_MANAGER"]}>
                <DutyManagement />
              </RequireRole>
            } />
            <Route path="night-shift-review" element={
              <RequireRole allowedRoles={["ADMIN", "DOCTOR", "NURSE_MANAGER"]}>
                <NightShiftReview />
              </RequireRole>
            } />
            <Route path="sync-queue" element={<SyncQueue />} />
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
