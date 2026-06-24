import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import AuthGuard from "@/components/layout/AuthGuard";

// Lazy-loaded pages
const LoginPage = lazy(() => import("@/features/auth/LoginPage"));
const DashboardPage = lazy(() => import("@/features/dashboard/DashboardPage"));
const PatientListPage = lazy(() => import("@/features/patients/PatientListPage"));
const PatientFormPage = lazy(() => import("@/features/patients/PatientFormPage"));
const PatientDetailPage = lazy(() => import("@/features/patients/PatientDetailPage"));
const ControlsPage = lazy(() => import("@/features/controls/ControlsPage"));
const TreatmentsPage = lazy(() => import("@/features/treatments/TreatmentsPage"));
const ReportsPage = lazy(() => import("@/features/reports/ReportsPage"));
const AlertsPage = lazy(() => import("@/features/alerts/AlertsPage"));
const UsersPage = lazy(() => import("@/features/users/UsersPage"));
const SettingsPage = lazy(() => import("@/features/settings/SettingsPage"));

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-neutral-400">Cargando...</div>
    </div>
  );
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

const router = createBrowserRouter([
  {
    // C1: Login outside AppLayout — no sidebar/header visible
    path: "login",
    element: <SuspenseWrapper><LoginPage /></SuspenseWrapper>,
  },
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        element: <AuthGuard />,
        children: [
          { path: "dashboard", element: <SuspenseWrapper><DashboardPage /></SuspenseWrapper> },
          { path: "patients", element: <SuspenseWrapper><PatientListPage /></SuspenseWrapper> },
          { path: "patients/new", element: <SuspenseWrapper><PatientFormPage /></SuspenseWrapper> },
          { path: "patients/:id", element: <SuspenseWrapper><PatientDetailPage /></SuspenseWrapper> },
          { path: "patients/:id/edit", element: <SuspenseWrapper><PatientFormPage /></SuspenseWrapper> },
          { path: "controls", element: <SuspenseWrapper><ControlsPage /></SuspenseWrapper> },
          { path: "treatments", element: <SuspenseWrapper><TreatmentsPage /></SuspenseWrapper> },
          { path: "reports", element: <SuspenseWrapper><ReportsPage /></SuspenseWrapper> },
          { path: "alerts", element: <SuspenseWrapper><AlertsPage /></SuspenseWrapper> },
          { path: "users", element: <SuspenseWrapper><UsersPage /></SuspenseWrapper> },
          { path: "settings", element: <SuspenseWrapper><SettingsPage /></SuspenseWrapper> },
        ],
      },
    ],
  },
]);

export default router;
