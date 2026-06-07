import React, { useState, useContext } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Loader2, User, Building, Zap } from "lucide-react";

export default function Register() {
  const [role, setRole] = useState("CANDIDATE");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect");

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const user = await register({ name, email, password, role, orgName });

      if (redirectUrl) {
        navigate(redirectUrl);
      } else if (user?.role === "CANDIDATE") {
        navigate("/dashboard/candidate");
      } else {
        navigate("/dashboard/recruiter");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950 px-4 py-12">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/3 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-zinc-500/3 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative animate-fade-in">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-white/10">
            <Zap className="w-5 h-5 text-zinc-950" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">
            Interview<span className="text-blue-400">IQ</span>
          </span>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Create an Account
            </h1>
            <p className="text-sm text-zinc-400 mt-2">
              Get started with Interview IQ
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="flex p-1 bg-zinc-950 border border-zinc-800 rounded-xl">
              <button
                type="button"
                onClick={() => setRole("CANDIDATE")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  role === "CANDIDATE"
                    ? "bg-white text-zinc-950 shadow-lg"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <User className="w-4 h-4" /> Candidate
              </button>
              <button
                type="button"
                onClick={() => setRole("RECRUITER")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  role === "RECRUITER"
                    ? "bg-white text-zinc-950 shadow-lg"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Building className="w-4 h-4" /> Recruiter
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength="6"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                placeholder="••••••••"
              />
            </div>

            {role === "RECRUITER" && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Organization Name
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  placeholder="Acme Corp"
                />
                <p className="text-xs text-zinc-500 mt-1.5">
                  This will create a new organization workspace.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white text-zinc-950 font-semibold rounded-xl px-4 py-3 mt-2 hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center justify-center shadow-lg shadow-white/5 hover:shadow-white/10"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-400">
              Already have an account?{" "}
              <Link
                to={`/login${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
                className="text-blue-400 font-medium hover:text-blue-300 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
