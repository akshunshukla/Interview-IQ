import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { LogOut, Zap, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const dashboardPath =
    user?.role === "RECRUITER"
      ? "/dashboard/recruiter"
      : "/dashboard/candidate";

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          to={dashboardPath}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-lg shadow-white/10 group-hover:shadow-white/20 transition-shadow">
            <Zap className="w-4 h-4 text-zinc-950" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            Interview<span className="text-blue-400">IQ</span>
          </span>
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            <Link
              to={dashboardPath}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-800/50"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>

            <div className="h-5 w-px bg-zinc-800" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-zinc-200">
                  {user.name}
                </p>
                <p className="text-xs text-zinc-500 capitalize">
                  {user.role?.toLowerCase()}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
