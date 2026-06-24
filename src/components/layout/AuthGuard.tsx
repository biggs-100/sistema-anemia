import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { ROUTES } from "@/utils/constants";

interface AuthGuardProps {
  requiredRoles?: number[];
}

export default function AuthGuard({ requiredRoles }: AuthGuardProps) {
  const { isAuthenticated, isLoading, user, checkSession } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRoles && user && !requiredRoles.includes(user.rolId)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
}
