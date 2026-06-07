import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import Navbar from "../components/Navbar";
import InterviewReport from "../components/InterviewReport";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  FileText,
  Download,
  MessageSquare,
  Zap,
  User as UserIcon,
  Camera,
} from "lucide-react";

export default function ApplicantDetail() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [application, setApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [activeTab, setActiveTab] = useState("report");

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/applications/${applicationId}/details`);
        setApplication(res.data.data.application);
      } catch (error) {
        console.error("Failed to fetch application:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [applicationId]);

  const handleVerdict = async (status) => {
    setUpdatingStatus(status);
    try {
      await api.patch(`/applications/${applicationId}/verdict`, {
        status,
        decisionReason: decisionReason || undefined,
      });
      const res = await api.get(`/applications/${applicationId}/details`);
      setApplication(res.data.data.application);
      setDecisionReason("");
    } catch (error) {
      console.error("Failed to update verdict:", error);
      toast.error("Failed to update verdict");
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <p className="text-zinc-400">Application not found.</p>
        </div>
      </div>
    );
  }

  const interview = application.interviews?.[0];
  const report = interview?.report;

  const getStatusBadge = (status) => {
    const styles = {
      APPLIED: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
      INTERVIEWING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      SHORTLISTED: "bg-white/10 text-white border-white/20",
      REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
      HIRED: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    };
    return styles[status] || styles.APPLIED;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">
                  {application.applicant?.name}
                </h1>
                <span
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStatusBadge(application.status)}`}
                >
                  {application.status}
                </span>
              </div>
              <p className="text-zinc-400">{application.applicant?.email}</p>
              <p className="text-sm text-zinc-500 mt-1">
                Applied for:{" "}
                <span className="text-zinc-300 font-medium">
                  {application.job?.title}
                </span>
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                Applied on {new Date(application.createdAt).toLocaleDateString()}
              </p>
            </div>

            {application.resumeFileUrl && (
              <a
                href={application.resumeFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700/50 transition-all shrink-0"
              >
                <Download className="w-4 h-4" />
                Download Resume
              </a>
            )}
          </div>
        </div>

        {(application.status === "APPLIED" ||
          application.status === "INTERVIEWING") && report && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-8 animate-slide-up">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
              Recruiter Decision
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">
                  Reason (optional)
                </label>
                <textarea
                  rows="2"
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none resize-none transition-all"
                  placeholder="Add a note about your decision..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleVerdict("SHORTLISTED")}
                  disabled={!!updatingStatus}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all disabled:opacity-50"
                >
                  {updatingStatus === "SHORTLISTED" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Shortlist
                </button>
                <button
                  onClick={() => handleVerdict("REJECTED")}
                  disabled={!!updatingStatus}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all disabled:opacity-50"
                >
                  {updatingStatus === "REJECTED" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl mb-8 w-fit">
          <button
            onClick={() => setActiveTab("report")}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "report"
                ? "bg-blue-500/10 text-blue-400 shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            AI Report
          </button>
          <button
            onClick={() => setActiveTab("transcript")}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "transcript"
                ? "bg-blue-500/10 text-blue-400 shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Transcript
          </button>
          <button
            onClick={() => setActiveTab("resume")}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "resume"
                ? "bg-blue-500/10 text-blue-400 shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            Resume
          </button>
          {interview?.interviewType === "JOB" && (
            <button
              onClick={() => setActiveTab("snapshots")}
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeTab === "snapshots"
                  ? "bg-blue-500/10 text-blue-400 shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Camera className="w-4 h-4" />
              Snapshots ({interview.snapshots?.length || 0})
            </button>
          )}
        </div>

        <div className="animate-fade-in">
          {activeTab === "report" && (
            <>
              {report ? (
                <InterviewReport report={report} />
              ) : (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
                  <p className="text-zinc-400">
                    {interview
                      ? interview.status === "COMPLETED"
                        ? "Report is being generated..."
                        : "Interview is still in progress."
                      : "No interview conducted yet."}
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === "transcript" && (
            <div className="space-y-4">
              {interview?.turns?.length > 0 ? (
                interview.turns.map((turn, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      turn.speaker === "USER" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        turn.speaker === "AI"
                          ? "bg-blue-500/20"
                          : "bg-zinc-800"
                      }`}
                    >
                      {turn.speaker === "AI" ? (
                        <Zap className="w-4 h-4 text-blue-400" />
                      ) : (
                        <UserIcon className="w-4 h-4 text-zinc-400" />
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                        turn.speaker === "AI"
                          ? "bg-zinc-800/60 border border-zinc-700/50 text-zinc-200 rounded-tl-md"
                          : "bg-blue-500/10 border border-blue-500/20 text-zinc-200 rounded-tr-md"
                      }`}
                    >
                      <span className="text-xs font-medium text-zinc-500 block mb-1">
                        {turn.speaker === "AI" ? "Interviewer" : "Candidate"}
                      </span>
                      {turn.text}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-zinc-500 text-sm text-center py-8">
                  No transcript available.
                </p>
              )}
            </div>
          )}

          {activeTab === "resume" && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              {application.resume_text ? (
                <pre className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed font-sans">
                  {application.resume_text}
                </pre>
              ) : (
                <p className="text-zinc-500 text-sm text-center py-8">
                  Resume text not available.
                </p>
              )}
            </div>
          )}

          {activeTab === "snapshots" && (
            <div className="space-y-4">
              {interview?.snapshots?.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {interview.snapshots.map((snap, i) => (
                    <div key={snap.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                      <img
                        src={snap.imageUrl}
                        alt={`Snapshot ${i + 1}`}
                        className="w-full aspect-video object-cover"
                      />
                      <div className="px-3 py-2">
                        <p className="text-xs text-zinc-500">
                          {new Date(snap.capturedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center animate-fade-in">
                  <Camera className="w-8 h-8 text-red-400 mx-auto mb-3" />
                  <p className="text-red-400 font-bold text-lg">⚠️ 0 snapshots captured</p>
                  <p className="text-red-400/80 text-sm mt-2 max-w-md mx-auto">
                    The candidate may have denied camera permissions, used a broken camera, or bypassed the proctoring system.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
