import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="container-max section-padding py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-error-100 text-error-600 mx-auto mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="font-display font-bold text-2xl text-gray-900">Accès refusé</h2>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">
          Cette page est réservée aux administrateurs autorisés. Votre compte
          n'a pas les permissions nécessaires.
        </p>
        <Link to="/dashboard" className="btn-primary mt-6">
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
