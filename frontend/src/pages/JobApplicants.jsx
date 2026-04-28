import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Users,
  TrendingUp,
} from "lucide-react";

export default function JobApplicants() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchApplications = async () => {
    try {
      const res = await api.get(`/applications/job/${jobId}`);
      setApplications(res.data.data.applications);
    } catch (error) {
      console.error("Failed to fetch applications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [jobId]);

  const handleVerdict = async (applicationId, status) => {
    setUpdatingId(applicationId);
    try {
      await api.patch(`/applications/${applicationId}/verdict`, { status });
      fetchApplications();
    } catch (error) {
      console.error("Failed to update verdict:", error);
      alert("Failed to update verdict");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      APPLIED: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
      INTERVIEWING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      SHORTLISTED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
      HIRED: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    };
    return styles[status] || styles.APPLIED;
  };

  const getVerdictIcon = (verdict) => {
    switch (verdict) {
      case "HIRE":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "NO HIRE":
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    }
  };

  const getVerdictStyle = (verdict) => {
    switch (verdict) {
      case "HIRE":
        return "text-emerald-400";
      case "NO HIRE":
        return "text-red-400";
      default:
        return "text-amber-400";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Back */}
        <button
          onClick={() => navigate("/dashboard/recruiter")}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-500" />
              Applicants
            </h1>
            <p className="text-zinc-400 mt-1">
              {applications.length} candidate{applications.length !== 1 && "s"}{" "}
              — sorted by AI score
            </p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-zinc-400">Sorted by AI Score</span>
          </div>
        </div>

        {/* Applicant List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-24 rounded-xl" />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-center">
            <Users className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg">No applicants yet</p>
            <p className="text-zinc-600 text-sm mt-1">
              Candidates will appear here once they apply and complete their AI
              interview.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app, index) => {
              const interview = app.interviews?.[0];
              const report = interview?.report;
              const totalScore = app._totalScore;
              const avgScore =
                totalScore !== null ? Math.round(totalScore / 4) : null;

              return (
                <div
                  key={app.id}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Rank */}
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-400">
                        {index + 1}
                      </div>

                      {/* Candidate info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-white truncate">
                            {app.applicant?.name}
                          </h3>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusBadge(app.status)}`}
                          >
                            {app.status}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-500 truncate">
                          {app.applicant?.email}
                        </p>
                      </div>

                      {/* AI Score */}
                      <div className="hidden md:flex items-center gap-6">
                        {report ? (
                          <>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-white">
                                {avgScore}
                                <span className="text-sm text-zinc-500">
                                  /100
                                </span>
                              </p>
                              <p className="text-xs text-zinc-500">AI Score</p>
                            </div>

                            {app.status !== "APPLIED" ? (
                              <div className="flex items-center gap-1.5">
                                {app.status === "SHORTLISTED" || app.status === "HIRED" ? (
                                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-400" />
                                )}
                                <span
                                  className={`text-sm font-semibold ${
                                    app.status === "SHORTLISTED" || app.status === "HIRED"
                                      ? "text-emerald-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {app.status}
                                </span>
                              </div>
                            ) : report.final_verdict && (
                              <div className="flex items-center gap-1.5">
                                {getVerdictIcon(report.final_verdict)}
                                <span
                                  className={`text-sm font-semibold ${getVerdictStyle(report.final_verdict)}`}
                                >
                                  AI: {report.final_verdict}
                                </span>
                              </div>
                            )}
                          </>
                        ) : interview ? (
                          <span className="text-sm text-zinc-500 italic">
                            {interview.status === "IN_PROGRESS"
                              ? "Interview in progress..."
                              : "Awaiting interview"}
                          </span>
                        ) : (
                          <span className="text-sm text-zinc-600">
                            No interview
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      {report && app.status === "APPLIED" && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerdict(app.id, "SHORTLISTED");
                            }}
                            disabled={updatingId === app.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                          >
                            {updatingId === app.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            Shortlist
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerdict(app.id, "REJECTED");
                            }}
                            disabled={updatingId === app.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-50"
                          >
                            <XCircle className="w-3 h-3" />
                            Reject
                          </button>
                        </>
                      )}

                      <button
                        onClick={() =>
                          navigate(`/applications/${app.id}`)
                        }
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-zinc-400 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700/50 transition-all"
                      >
                        Details
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Mobile score */}
                  {report && (
                    <div className="md:hidden mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-400">
                          AI Score:
                        </span>
                        <span className="text-lg font-bold text-white">
                          {avgScore}/100
                        </span>
                      </div>
                      {app.status !== "APPLIED" ? (
                        <div className="flex items-center gap-1.5">
                          {app.status === "SHORTLISTED" || app.status === "HIRED" ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                          <span
                            className={`text-sm font-semibold ${
                              app.status === "SHORTLISTED" || app.status === "HIRED"
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {app.status}
                          </span>
                        </div>
                      ) : report.final_verdict && (
                        <div className="flex items-center gap-1.5">
                          {getVerdictIcon(report.final_verdict)}
                          <span
                            className={`text-sm font-semibold ${getVerdictStyle(report.final_verdict)}`}
                          >
                            AI: {report.final_verdict}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
