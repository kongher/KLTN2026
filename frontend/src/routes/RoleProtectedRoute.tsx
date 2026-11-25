import { Navigate } from "react-router-dom";
import { getDashboardPath, useAuth } from "../contexts/AuthContext";
import type { UserRole } from "../types/auth";
import type { ReactNode } from "react";

type Props = {
  roles: UserRole[];
  children: ReactNode;
};

export default function RoleProtectedRoute({ roles, children }: Props) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center text-stone-500">Đang tải...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return children;
}
