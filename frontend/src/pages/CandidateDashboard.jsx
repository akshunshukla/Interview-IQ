import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import api from "../services/api";
import {
  Briefcase,
  Upload,
  Loader2,
  ArrowRight,
  Sparkles,
  Clock,
  CheckCircle,
  FileText,
  ChevronRight,
} from "lucide-react";

export default function CandidateDashboard() {
  const { user } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, interviewsRes] = await Promise.all([
          api.get("/jobs"),
          api.get("/interview/my"),
        ]);
        setJobs(jobsRes.data.data.jobs);
        setInterviews(interviewsRes.data.data.interviews);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!resumeFile || !selectedJob) return;

    setIsApplying(true);
    const formData = new FormData();
    formData.append("resume", resumeFile);

    try {
      const response = await api.post(
        `/applications/${selectedJob.id}/apply`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const interviewId = response.data.data.interview.id;

      // Start the interview immediately
      const startRes = await api.post("/interview/start", {
        interviewId,
        interviewType: "JOB",
      });

      navigate(`/interview/${interviewId}`);
    } catch (error) {
      console.error("Application failed:", error);
      alert(error.response?.data?.message || "Failed to apply");
    } finally {
      setIsApplying(false);
    }
  };

  const activeInterviews = interviews.filter(
    (i) => i.status === "IN_PROGRESS" || i.status === "PENDING"
  );
  const completedInterviews = interviews.filter(
    (i) => i.status === "COMPLETED"
  );

  const getStatusStyle = (status) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "IN_PROGRESS":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-10 animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, <span className="text-emerald-400">{user?.name?.split(" ")[0]}</span>
          </h1>
          <p className="text-zinc-400 mt-2">
            Apply to jobs, take mock interviews, and track your progress.
          </p>
        </div>

        {/* Active Interviews Banner */}
        {activeInterviews.length > 0 && (
          <div className="mb-8 animate-slide-up">
            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">
                Active Interviews
              </h2>
              <div className="space-y-2">
                {activeInterviews.map((interview) => (
                  <button
                    key={interview.id}
                    onClick={() => navigate(`/interview/${interview.id}`)}
                    className="w-full flex items-center justify-between p-3 bg-zinc-900/60 rounded-xl hover:bg-zinc-900 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span className="text-sm text-zinc-200">
                        {interview.application?.job?.title ||
                          interview.targetRole ||
                          "Mock Interview"}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusStyle(interview.status)}`}
                      >
                        {interview.status.replace("_", " ")}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Mock Interview Card */}
          <div className="lg:col-span-1 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 h-full hover:border-zinc-700 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Mock Interview
                  </h2>
                  <p className="text-xs text-zinc-500">Practice with AI</p>
                </div>
              </div>

              <p className="text-sm text-zinc-400 mb-6">
                Upload your resume and choose a target role. AI will conduct a
                practice interview with up to 6 questions and provide feedback.
              </p>

              <button
                onClick={() => navigate("/mock-interview/setup")}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl px-4 py-3 hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25"
              >
                <Sparkles className="w-4 h-4" />
                Start Mock Interview
              </button>
            </div>
          </div>

          {/* Job Listings */}
          <div className="lg:col-span-2 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-500" />
                Open Positions
              </h2>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton h-24 rounded-xl" />
                  ))}
                </div>
              ) : jobs.length === 0 ? (
                <div className="p-8 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-500 text-center">
                  No open positions right now. Check back later!
                </div>
              ) : (
                <div className="grid gap-3">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className={`p-5 rounded-xl border cursor-pointer transition-all ${
                        selectedJob?.id === job.id
                          ? "bg-emerald-500/5 border-emerald-500/40 shadow-lg shadow-emerald-500/5"
                          : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-lg text-white">
                            {job.title}
                          </h3>
                          <p className="text-sm text-zinc-400 mt-1">
                            {job.organization?.name} •{" "}
                            <span className="capitalize">
                              {job.workMode?.toLowerCase()}
                            </span>
                            {job.experienceLevel &&
                              ` • ${job.experienceLevel}`}
                          </p>
                        </div>
                        {selectedJob?.id === job.id && (
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        )}
                      </div>
                      {job.tech_stack?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {job.tech_stack.slice(0, 5).map((tech, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded-md"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Application Form */}
              {selectedJob && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mt-4 animate-fade-in">
                  <h3 className="text-lg font-semibold mb-4">
                    Apply for{" "}
                    <span className="text-emerald-400">{selectedJob.title}</span>
                  </h3>

                  <form onSubmit={handleApply} className="space-y-5">
                    <div className="relative flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-zinc-700 border-dashed rounded-xl cursor-pointer bg-zinc-950/50 hover:bg-zinc-900/50 hover:border-emerald-500/30 transition-all">
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
                      <p className="text-sm text-emerald-400 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> {resumeFile.name}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isApplying || !resumeFile}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl px-4 py-3 hover:from-emerald-500 hover:to-teal-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15"
                    >
                      {isApplying ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Start AI Interview <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Interview History */}
        {completedInterviews.length > 0 && (
          <div className="mt-12 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-zinc-400" />
              Interview History
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedInterviews.map((interview) => {
                const report = interview.report;
                const avgScore = report
                  ? Math.round(
                      ((report.tech_score || 0) +
                        (report.comm_score || 0) +
                        (report.problemSolvingScore || 0) +
                        (report.clarityScore || 0)) /
                        4
                    )
                  : null;

                return (
                  <button
                    key={interview.id}
                    onClick={() =>
                      navigate(`/interview/${interview.id}/results`)
                    }
                    className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 text-left hover:border-zinc-700 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-zinc-500 uppercase">
                        {interview.interviewType}
                      </span>
                      {avgScore !== null && (
                        <span className="text-lg font-bold text-white">
                          {avgScore}
                          <span className="text-sm text-zinc-500">/100</span>
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-white mb-1">
                      {interview.application?.job?.title ||
                        interview.targetRole ||
                        "Mock Interview"}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {new Date(interview.createdAt).toLocaleDateString()}
                    </p>
                    {interview.application?.status && interview.application.status !== "APPLIED" ? (
                      <span
                        className={`inline-block mt-3 px-2.5 py-1 text-xs font-semibold rounded-full border ${
                          interview.application.status === "SHORTLISTED" || interview.application.status === "HIRED"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : interview.application.status === "REJECTED"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {interview.application.status}
                      </span>
                    ) : report?.final_verdict && (
                      <span
                        className={`inline-block mt-3 px-2.5 py-1 text-xs font-semibold rounded-full border ${
                          report.final_verdict === "HIRE"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : report.final_verdict === "NO HIRE"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        AI: {report.final_verdict}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
