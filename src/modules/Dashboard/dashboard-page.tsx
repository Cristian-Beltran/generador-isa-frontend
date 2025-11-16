import { useAuthStore } from "@/auth/useAuth";
import { Navigate } from "react-router-dom";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const redirectTo = user?.type === "patient" ? "/me" : "/patients";
  if (redirectTo) return <Navigate to={redirectTo} replace />;
}
