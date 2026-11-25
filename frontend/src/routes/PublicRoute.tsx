import { Navigate } from "react-router-dom";
import { getDashboardPath, useAuth } from "../contexts/AuthContext";
import type { ReactNode } from "react";

export default function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center text-stone-500">Đang tải...</div>;
  }

  if (user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return children;
}
