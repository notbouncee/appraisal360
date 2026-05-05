import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, mustChangePassword } = useAuth();
  if (loading) return null;
  if (mustChangePassword) return <Navigate to="/change-password" replace />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}
