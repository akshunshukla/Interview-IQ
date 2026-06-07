import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import InterviewReport from "../components/InterviewReport";
import {
  Loader2,
  ArrowLeft,
  Zap,
  User as UserIcon,
  MessageSquare,
} from "lucide-react";

export default function InterviewResults() {
  const { interviewId } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("report");

  useEffect(() => {
    let timeoutId;
    const fetchInterview = async () => {
      try {
        const res = await api.get(`/interview/${interviewId}`);
        const data = res.data.data.interview;
        setInterview(data);

        const reportNotReady =
          !data.report || data.report.generationStatus === "PENDING";

        if (data.status === "COMPLETED" && reportNotReady) {
          timeoutId = setTimeout(fetchInterview, 3000);
        }
      } catch (error) {
        console.error("Failed to fetch interview:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInterview();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [interviewId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <p className="text-zinc-400">Interview not found.</p>
        </div>
      </div>
    );
  }

  const report = interview.report;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate("/dashboard/candidate")}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold tracking-tight">
            Interview Results
          </h1>
          <p className="text-zinc-400 mt-1">
            {interview.interviewType === "MOCK"
              ? `Mock Interview — ${interview.targetRole}`
              : `Job Interview — ${interview.application?.job?.title || "Position"}`}
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            {new Date(interview.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl mb-8 w-fit">
          <button
            onClick={() => setActiveTab("report")}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "report"
                ? "bg-blue-500/10 text-blue-400 shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Report
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
        </div>

        {activeTab === "report" ? (
          <div className="animate-fade-in">
            {report ? (
              <InterviewReport report={report} />
            ) : interview.status === "FAILED" ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center">
                <p className="text-red-400 font-medium">
                  The interview failed or the report could not be generated.
                </p>
              </div>
            ) : (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
                <p className="text-zinc-400">
                  Report is being generated. This usually takes about 30 seconds...
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {interview.turns?.map((turn, index) => (
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
                    {turn.speaker === "AI" ? "Interviewer" : "You"}
                  </span>
                  {turn.text}
                </div>
              </div>
            ))}

            {(!interview.turns || interview.turns.length === 0) && (
              <p className="text-zinc-500 text-sm text-center py-8">
                No transcript available.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
