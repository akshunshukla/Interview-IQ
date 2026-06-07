import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import Navbar from "../components/Navbar";
import {
  Plus,
  Briefcase,
  Loader2,
  Users,
  ChevronRight,
  MapPin,
  Link,
  EyeOff,
  Check,
  Copy,
} from "lucide-react";

export default function RecruiterDashboard() {
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState("");
  const [maxApplicants, setMaxApplicants] = useState(20);
  const [workMode, setWorkMode] = useState("REMOTE");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [isUnlisted, setIsUnlisted] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  const navigate = useNavigate();

  const fetchJobs = async () => {
    try {
      const response = await api.get("/jobs/my");
      setJobs(response.data.data.jobs);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      await api.post("/jobs", {
        title,
        job_description: description,
        tech_stack: techStack
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        max_applicants: parseInt(maxApplicants),
        workMode,
        experienceLevel: experienceLevel || null,
        isUnlisted,
      });

      setTitle("");
      setDescription("");
      setTechStack("");
      setMaxApplicants(20);
      setWorkMode("REMOTE");
      setExperienceLevel("");
      setIsUnlisted(false);
      setShowForm(false);
      fetchJobs();
    } catch (error) {
      console.error("Failed to create job:", error);
      toast.error(error.response?.data?.message || "Failed to create job");
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "OPEN":
        return "bg-white/10 text-white border-white/20";
      case "PAUSED":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "CLOSED":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-10 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Recruiter Dashboard
            </h1>
            <p className="text-zinc-400 mt-2">
              Manage job postings and review AI-screened candidates.
            </p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-zinc-950 font-semibold rounded-xl hover:bg-zinc-200 transition-all shadow-lg shadow-white/5 hover:shadow-white/10"
          >
            <Plus className="w-4 h-4" />
            Post Job
          </button>
        </div>

        {showForm && (
          <div className="mb-10 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 animate-slide-up">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-400" />
              Post New Job
            </h2>

            <form
              onSubmit={handleCreateJob}
              className="grid md:grid-cols-2 gap-6"
            >
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Job Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder="e.g. Senior Frontend Engineer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Tech Stack{" "}
                  <span className="text-zinc-500 font-normal">
                    (comma separated)
                  </span>
                </label>
                <input
                  type="text"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder="React, Node.js, PostgreSQL"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Job Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows="4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none resize-none transition-all"
                  placeholder="Describe the role, responsibilities, and requirements..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Work Mode
                </label>
                <select
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none transition-all"
                >
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ONSITE">On-site</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Experience Level
                </label>
                <input
                  type="text"
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder="e.g. 3-5 years"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Max Applicants <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={maxApplicants}
                  onChange={(e) => setMaxApplicants(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3 p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsUnlisted(!isUnlisted)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    isUnlisted ? "bg-white" : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform ${
                      isUnlisted ? "translate-x-5 bg-zinc-950" : "bg-white"
                    }`}
                  />
                </button>
                <div>
                  <p className="text-sm font-medium text-zinc-200 flex items-center gap-1.5">
                    <EyeOff className="w-3.5 h-3.5" />
                    Invite-Only (Unlisted)
                  </p>
                  <p className="text-xs text-zinc-500">
                    Hidden from public job board. Only accessible via a shareable invite link.
                  </p>
                </div>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full bg-white text-zinc-950 font-semibold rounded-xl px-4 py-3 hover:bg-zinc-200 transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-white/5"
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Post Job"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-zinc-400" />
            Your Job Postings
          </h2>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-28 rounded-xl" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-12 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-center">
              <Briefcase className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400 text-lg">No job postings yet</p>
              <p className="text-zinc-600 text-sm mt-1">
                Create your first job posting to start screening candidates with
                AI.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {jobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => navigate(`/jobs/${job.id}/applicants`)}
                  className="w-full p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center justify-between hover:border-zinc-700 transition-all group text-left"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg text-white">
                        {job.title}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStatusColor(job.status)}`}
                      >
                        {job.status}
                      </span>
                      {job.isUnlisted && (
                        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full border bg-zinc-800 text-zinc-300 border-zinc-700 flex items-center gap-1">
                          <EyeOff className="w-3 h-3" />
                          Invite-Only
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                      {job.organization?.name && (
                        <span>{job.organization.name}</span>
                      )}
                      <span className="flex items-center gap-1 capitalize">
                        <MapPin className="w-3.5 h-3.5" />
                        {job.workMode?.toLowerCase()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        Max: {job.max_applicants}
                      </span>
                    </div>

                    {job.tech_stack?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {job.tech_stack.slice(0, 6).map((tech, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded-md"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    {job.isUnlisted && job.accessCode && (
                      <div
                        className="mt-3 flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-zinc-400 font-mono">
                          <Link className="w-3 h-3 text-zinc-300 shrink-0" />
                          <span className="truncate max-w-[280px]">
                            {window.location.origin}/invite/{job.accessCode}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(
                              `${window.location.origin}/invite/${job.accessCode}`
                            );
                            setCopiedCode(job.id);
                            setTimeout(() => setCopiedCode(null), 2000);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-all"
                        >
                          {copiedCode === job.id ? (
                            <><Check className="w-3 h-3" /> Copied!</>
                          ) : (
                            <><Copy className="w-3 h-3" /> Copy</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-blue-400 transition-colors shrink-0 ml-4" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
