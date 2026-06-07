import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  Zap,
  Mic,
  BarChart3,
  Users,
  ArrowRight,
  Shield,
  Clock,
  ChevronRight,
} from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Voice-Powered Interviews",
    desc: "Candidates speak naturally while AI conducts a structured, adaptive interview in real-time.",
  },
  {
    icon: BarChart3,
    title: "Instant AI Reports",
    desc: "Get detailed scoring across technical skills, communication, problem-solving, and clarity.",
  },
  {
    icon: Users,
    title: "Smart Candidate Ranking",
    desc: "Applicants are ranked by AI scores, making shortlisting decisions data-driven and fast.",
  },
];

const steps = [
  { num: "01", title: "Post a Job", desc: "Create a job listing with requirements and tech stack." },
  { num: "02", title: "Candidates Apply & Interview", desc: "AI conducts a timed voice interview automatically." },
  { num: "03", title: "Review & Decide", desc: "Get AI-generated reports with scores and verdicts." },
];

export default function LandingPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleCTA = () => {
    if (user) {
      navigate(user.role === "RECRUITER" ? "/dashboard/recruiter" : "/dashboard/candidate");
    } else {
      navigate("/register");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <nav className="fixed top-0 w-full z-50 border-b border-zinc-800/40 bg-zinc-950/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <Zap className="w-4 h-4 text-zinc-950" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Interview<span className="text-blue-400">IQ</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold bg-white text-zinc-950 px-5 py-2 rounded-lg hover:bg-zinc-200 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/[0.03] rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-zinc-500/[0.03] rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-zinc-400 mb-8 animate-fade-in">
            <Shield className="w-3 h-3 text-blue-400" />
            AI-Powered Interview Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Hire smarter with
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-300 to-zinc-500">
              AI interviews
            </span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in" style={{ animationDelay: "0.2s" }}>
            InterviewIQ conducts voice-based interviews, generates detailed
            evaluation reports, and ranks candidates — so you can focus on
            hiring the right people.
          </p>

          <div className="flex items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <button
              onClick={handleCTA}
              className="flex items-center gap-2 px-8 py-3.5 bg-white text-zinc-950 font-semibold rounded-xl hover:bg-zinc-200 transition-all shadow-lg shadow-white/10 hover:shadow-white/20 text-base"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/login"
              className="flex items-center gap-2 px-8 py-3.5 text-zinc-300 border border-zinc-700 rounded-xl hover:bg-zinc-900 hover:border-zinc-600 transition-all text-base font-medium"
            >
              Sign In
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 mt-12 text-sm text-zinc-500 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> 10-min interviews
            </span>
            <span className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" /> Instant reports
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Video proctoring
            </span>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 border-t border-zinc-800/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Everything you need to hire better
            </h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">
              From automated interviews to AI-generated insights — built for
              modern recruiting teams.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="group p-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-5 group-hover:bg-blue-500/15 transition-colors">
                  <f.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 border-t border-zinc-800/40">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              How it works
            </h2>
            <p className="text-zinc-400 text-lg">
              Three simple steps to transform your hiring process.
            </p>
          </div>

          <div className="space-y-6">
            {steps.map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-6 p-6 bg-zinc-900/30 border border-zinc-800/60 rounded-2xl hover:border-zinc-700 transition-all group"
              >
                <span className="text-3xl font-bold text-zinc-700 group-hover:text-blue-500/30 transition-colors shrink-0">
                  {step.num}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-zinc-400">{step.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-700 group-hover:text-zinc-500 transition-colors shrink-0 mt-1 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 border-t border-zinc-800/40">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Ready to hire smarter?
          </h2>
          <p className="text-zinc-400 text-lg mb-10">
            Join InterviewIQ and let AI handle the screening while you focus on
            finding the perfect fit.
          </p>
          <button
            onClick={handleCTA}
            className="inline-flex items-center gap-2 px-10 py-4 bg-white text-zinc-950 font-semibold rounded-xl hover:bg-zinc-200 transition-all shadow-lg shadow-white/10 hover:shadow-white/20 text-lg"
          >
            Start Now — It's Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      <footer className="border-t border-zinc-800/40 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
              <Zap className="w-3 h-3 text-zinc-950" />
            </div>
            <span className="text-sm font-semibold text-zinc-400">
              InterviewIQ
            </span>
          </div>
          <p className="text-xs text-zinc-600">
            Built with Gemini AI, Deepgram, React & Node.js
          </p>
        </div>
      </footer>
    </div>
  );
}
