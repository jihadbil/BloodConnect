import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../hooks/use-auth";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, userRole } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }

    if (allowedRoles && userRole) {
      if (!allowedRoles.includes(userRole)) {
        if (userRole === "Donor") {
          setLocation("/donor/dashboard");
        } else if (userRole === "Staff") {
          setLocation("/staff/dashboard");
        } else if (userRole === "Admin") {
          setLocation("/admin/dashboard");
        } else {
          setLocation("/");
        }
      }
    }
  }, [isAuthenticated, userRole, allowedRoles, setLocation]);

  if (!isAuthenticated) return null;
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) return null;

  return <>{children}</>;
}
