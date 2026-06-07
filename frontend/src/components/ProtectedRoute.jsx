import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children, role }) {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    const redirect =
      user.role === "CANDIDATE"
        ? "/dashboard/candidate"
        : "/dashboard/recruiter";
    return <Navigate to={redirect} replace />;
  }

  return children;
}
