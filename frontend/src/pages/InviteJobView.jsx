import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import Navbar from "../components/Navbar";
import {
  Briefcase,
  Upload,
  Loader2,
  ArrowRight,
  FileText,
  MapPin,
  Users,
  AlertTriangle,
  Building2,
  EyeOff,
} from "lucide-react";

export default function InviteJobView() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const toast = useToast();

  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await api.get(`/jobs/invite/${code}`);
        setJob(res.data.data.job);
      } catch (err) {
        setError(
          err.response?.data?.message || "Invalid invite link or job not found."
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchJob();
  }, [code]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!resumeFile || !job) return;

    if (!user) {
      navigate(`/login?redirect=/invite/${code}`);
      return;
    }

    setIsApplying(true);
    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);

      const response = await api.post(
        `/applications/${job.id}/apply`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const interviewId = response.data.data.interview.id;
      navigate(`/interview/${interviewId}`);
    } catch (err) {
      console.error("Application failed:", err);
      toast.error(err.response?.data?.message || "Failed to apply. Please try again.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-4" />
            <p className="text-zinc-400">Loading job details...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Invalid Invite Link
            </h1>
            <p className="text-zinc-400 text-center max-w-md">
              {error}
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-6 px-6 py-2.5 text-sm font-medium text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all"
            >
              Go Home
            </button>
          </div>
        ) : (
          <div className="animate-slide-up">
            <div className="flex items-center gap-2 mb-6">
              <span className="px-3 py-1 text-xs font-semibold rounded-full border bg-zinc-800 text-zinc-300 border-zinc-700 flex items-center gap-1.5">
                <EyeOff className="w-3 h-3" />
                Invite-Only Position
              </span>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 mb-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Briefcase className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">
                    {job.title}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-zinc-400">
                    {job.organization?.name && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {job.organization.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1 capitalize">
                      <MapPin className="w-3.5 h-3.5" />
                      {job.workMode?.toLowerCase()}
                    </span>
                    {job.experienceLevel && (
                      <span>{job.experienceLevel}</span>
                    )}
                  </div>
                </div>
              </div>

              {job.tech_stack?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {job.tech_stack.map((tech, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 text-xs font-medium bg-zinc-800 text-zinc-300 rounded-lg"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}

              <div className="border-t border-zinc-800 pt-6">
                <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">
                  About This Role
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">
                  {job.job_description}
                </p>
              </div>
            </div>

            {user && user.role === "CANDIDATE" ? (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
                <h2 className="text-lg font-semibold text-white mb-1">
                  Apply & Start AI Interview
                </h2>
                <p className="text-sm text-zinc-500 mb-6">
                  Upload your resume to begin. The AI interviewer will conduct a
                  screening interview based on this role.
                </p>

                <form onSubmit={handleApply} className="space-y-5">
                  <div className="relative flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-zinc-700 border-dashed rounded-xl cursor-pointer bg-zinc-950/50 hover:bg-zinc-900/50 hover:border-blue-500/30 transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-7 h-7 text-zinc-400 mb-2" />
                        <p className="text-sm text-zinc-400">
                          <span className="font-semibold text-white">
                            Upload resume
                          </span>{" "}
                          (PDF only)
                        </p>
                      </div>
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => setResumeFile(e.target.files[0])}
                        required
                      />
                    </label>
                  </div>
                  {resumeFile && (
                    <p className="text-sm text-blue-400 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> {resumeFile.name}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isApplying || !resumeFile}
                    className="w-full bg-white text-zinc-950 font-semibold rounded-xl px-4 py-3 hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-white/5"
                  >
                    {isApplying ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Start AI Interview{" "}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : user && user.role === "RECRUITER" ? (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
                <h2 className="text-lg font-semibold text-white mb-2">
                  Recruiter Account Detected
                </h2>
                <p className="text-sm text-zinc-500 mb-6">
                  Invite links are for candidates to apply. Share this link with
                  candidates you'd like to invite.
                </p>
                <button
                  onClick={() => navigate("/dashboard/recruiter")}
                  className="px-6 py-2.5 text-sm font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700 transition-all"
                >
                  Go to Dashboard
                </button>
              </div>
            ) : (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
                <h2 className="text-lg font-semibold text-white mb-2">
                  Sign in to Apply
                </h2>
                <p className="text-sm text-zinc-500 mb-6">
                  You need to create an account or log in to apply for this
                  position.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => navigate(`/login?redirect=/invite/${code}`)}
                    className="px-6 py-2.5 bg-white text-zinc-950 font-semibold rounded-xl hover:bg-zinc-200 transition-all"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => navigate(`/register?redirect=/invite/${code}`)}
                    className="px-6 py-2.5 text-sm font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700 transition-all"
                  >
                    Register
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
