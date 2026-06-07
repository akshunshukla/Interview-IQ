import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import {
  Upload,
  Loader2,
  Sparkles,
  FileText,
  ChevronRight,
} from "lucide-react";

const ROLE_SUGGESTIONS = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Scientist",
  "DevOps Engineer",
  "Mobile Developer",
  "Product Manager",
  "Machine Learning Engineer",
  "Cloud Architect",
  "QA Engineer",
];

export default function MockInterviewSetup() {
  const [resumeFile, setResumeFile] = useState(null);
  const [targetRole, setTargetRole] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleStart = async (e) => {
    e.preventDefault();
    if (!targetRole.trim()) return;

    setIsStarting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("interviewType", "MOCK");
      formData.append("targetRole", targetRole);
      if (resumeFile) {
        formData.append("resume", resumeFile);
      }

      const response = await api.post("/interview/start", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const interviewId = response.data.data.interview.id;
      navigate(`/interview/${interviewId}`);
    } catch (err) {
      console.error("Failed to start mock interview:", err);
      setError(
        err.response?.data?.message || "Failed to start interview. Try again."
      );
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="animate-fade-in">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Mock Interview
            </h1>
            <p className="text-zinc-400 mt-2">
              Practice with AI and get instant feedback on your performance.
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleStart} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Target Role <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  placeholder="e.g. Senior Frontend Engineer"
                />

                <div className="flex flex-wrap gap-2 mt-3">
                  {ROLE_SUGGESTIONS.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setTargetRole(role)}
                      className={`px-3 py-1 text-xs rounded-lg border transition-all ${targetRole === role
                          ? "bg-blue-500/10 border-blue-500/40 text-blue-400"
                          : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                        }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Resume{" "}
                  <span className="text-zinc-500 font-normal">(optional)</span>
                </label>
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-zinc-700 border-dashed rounded-xl cursor-pointer bg-zinc-950/50 hover:bg-zinc-900/50 hover:border-blue-500/30 transition-all">
                  <div className="flex flex-col items-center justify-center py-4">
                    <Upload className="w-7 h-7 text-zinc-400 mb-2" />
                    <p className="text-sm text-zinc-400">
                      <span className="font-semibold text-white">
                        Upload resume
                      </span>{" "}
                      for personalized questions
                    </p>
                    <p className="text-xs text-zinc-600 mt-1">PDF only</p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => setResumeFile(e.target.files[0])}
                  />
                </label>
                {resumeFile && (
                  <p className="text-sm text-blue-400 flex items-center gap-2 mt-2">
                    <FileText className="w-4 h-4" /> {resumeFile.name}
                  </p>
                )}
              </div>

              <div className="bg-zinc-800/30 border border-zinc-800 rounded-xl p-4">
                <p className="text-sm text-zinc-400">
                  <span className="text-white font-medium">How it works:</span>{" "}
                  The AI interviewer will conduct a 10-minute practice interview
                  based on your target role and resume. Speak your answers using
                  the microphone. After the interview, you'll receive a detailed
                  report with scores and feedback.
                </p>
              </div>

              <button
                type="submit"
                disabled={isStarting || !targetRole.trim()}
                className="w-full bg-white text-zinc-950 font-semibold rounded-xl px-4 py-3.5 hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-white/5 hover:shadow-white/10 text-base"
              >
                {isStarting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Start Interview
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
