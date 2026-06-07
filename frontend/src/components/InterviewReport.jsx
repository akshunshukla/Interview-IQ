import React from "react";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const ScoreBar = ({ label, score, color }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between text-sm">
      <span className="text-zinc-400">{label}</span>
      <span className="font-semibold text-white">{score ?? "—"}/100</span>
    </div>
    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
        style={{ width: `${score ?? 0}%` }}
      />
    </div>
  </div>
);

const VerdictBadge = ({ verdict }) => {
  const config = {
    HIRE: {
      icon: CheckCircle,
      bg: "bg-white/5",
      border: "border-white/20",
      text: "text-white",
    },
    "NO HIRE": {
      icon: XCircle,
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      text: "text-red-400",
    },
    "NEEDS REVIEW": {
      icon: AlertTriangle,
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      text: "text-amber-400",
    },
  };

  const c = config[verdict] || config["NEEDS REVIEW"];
  const Icon = c.icon;

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${c.bg} ${c.border}`}
    >
      <Icon className={`w-4 h-4 ${c.text}`} />
      <span className={`text-sm font-semibold ${c.text}`}>{verdict}</span>
    </div>
  );
};

export default function InterviewReport({ report }) {
  if (!report) return null;

  const totalScore =
    (report.tech_score || 0) +
    (report.comm_score || 0) +
    (report.problemSolvingScore || 0) +
    (report.clarityScore || 0);
  const avgScore = Math.round(totalScore / 4);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">AI Evaluation Report</h3>
          <p className="text-sm text-zinc-500 mt-1">
            Average Score: <span className="text-white font-semibold">{avgScore}/100</span>
          </p>
        </div>
        <VerdictBadge verdict={report.final_verdict} />
      </div>

      <div className="grid gap-4 bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
        <ScoreBar
          label="Technical Skills"
          score={report.tech_score}
          color="bg-gradient-to-r from-blue-500 to-blue-400"
        />
        <ScoreBar
          label="Communication"
          score={report.comm_score}
          color="bg-gradient-to-r from-sky-500 to-sky-400"
        />
        <ScoreBar
          label="Problem Solving"
          score={report.problemSolvingScore}
          color="bg-gradient-to-r from-amber-500 to-yellow-400"
        />
        <ScoreBar
          label="Clarity"
          score={report.clarityScore}
          color="bg-gradient-to-r from-zinc-400 to-zinc-300"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
            Strengths
          </h4>
          <ul className="space-y-2">
            {report.strengths?.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-zinc-300"
              >
                <CheckCircle className="w-4 h-4 text-white mt-0.5 shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">
            Areas for Improvement
          </h4>
          <ul className="space-y-2">
            {report.weaknesses?.map((w, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-zinc-300"
              >
                <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {report.finalRecommendation && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Final Recommendation
          </h4>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {report.finalRecommendation}
          </p>
        </div>
      )}
    </div>
  );
}
