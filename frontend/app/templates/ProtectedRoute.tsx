import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: string[];
};

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading, mustChangePassword } = useAuth();
  if (loading) return null;
  if (mustChangePassword) return <Navigate to="/change-password" replace />;
  if (!user) return <Navigate to="/auth" replace />;

  if (allowedRoles && allowedRoles.length > 0) {
    const role = (profile?.role || "").toLowerCase();
    const normalizedRoles = allowedRoles.map((item) => item.toLowerCase());
    if (!normalizedRoles.includes(role)) return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
