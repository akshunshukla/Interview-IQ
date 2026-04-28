import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  Mic,
  Square,
  Loader2,
  PhoneOff,
  Zap,
  User as UserIcon,
} from "lucide-react";

export default function InterviewRoom() {
  const { interviewId } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [aiQuestionCount, setAiQuestionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const transcriptEndRef = useRef(null);

  // Scroll to bottom of transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Load interview details on mount
  useEffect(() => {
    const loadInterview = async () => {
      try {
        const res = await api.get(`/interview/${interviewId}`);
        const data = res.data.data.interview;
        setInterview(data);

        if (data.turns?.length > 0) {
          setTranscript(
            data.turns.map((t) => ({
              speaker: t.speaker,
              text: t.text,
            }))
          );
          setAiQuestionCount(
            data.turns.filter((t) => t.speaker === "AI").length
          );
        }

        if (data.status === "COMPLETED") {
          navigate(`/interview/${interviewId}/results`, { replace: true });
        }
      } catch (error) {
        console.error("Failed to load interview:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadInterview();
  }, [interviewId, navigate]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Mic access denied:", error);
      alert("Microphone access is required for the interview.");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = async () => {
      setIsProcessing(true);

      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });
      const formData = new FormData();
      formData.append("audio", audioBlob, "answer.webm");
      formData.append("interviewId", interviewId);

      try {
        const response = await api.post("/interview/turn", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const { turn: aiTurn, isComplete, report, userText } = response.data.data;

        // Add user transcript
        if (userText) {
          setTranscript((prev) => [
            ...prev,
            { speaker: "USER", text: userText },
          ]);
        }

        if (isComplete) {
          // Interview finished
          navigate(`/interview/${interviewId}/results`);
          return;
        }

        // Add AI transcript
        if (aiTurn) {
          setTranscript((prev) => [
            ...prev,
            { speaker: "AI", text: aiTurn.text },
          ]);
          setAiQuestionCount((prev) => prev + 1);

          // Play AI audio
          if (aiTurn.audioUrl) {
            const audio = new Audio(aiTurn.audioUrl);
            audio.play().catch(console.error);
          }
        }
      } catch (error) {
        console.error("Turn processing failed:", error);
        alert("Failed to process your answer. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    mediaRecorderRef.current.stream
      .getTracks()
      .forEach((track) => track.stop());
  };

  const handleEndInterview = async () => {
    if (!confirm("Are you sure you want to end the interview?")) return;

    setIsFinishing(true);
    try {
      await api.post(`/interview/${interviewId}/finish`);
      navigate(`/interview/${interviewId}/results`);
    } catch (error) {
      console.error("Failed to finish interview:", error);
      alert("Failed to end interview. Please try again.");
    } finally {
      setIsFinishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const maxQ = interview?.maxQuestions || 7;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">
                {interview?.interviewType === "MOCK"
                  ? "Mock Interview"
                  : "AI Interview"}
              </h1>
              <p className="text-xs text-zinc-500">
                {interview?.application?.job?.title ||
                  interview?.targetRole ||
                  "Technical Screening"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Question counter */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg">
              <span className="text-xs text-zinc-500">Question</span>
              <span className="text-sm font-bold text-white">
                {aiQuestionCount}
                <span className="text-zinc-500">/{maxQ}</span>
              </span>
            </div>

            <button
              onClick={handleEndInterview}
              disabled={isFinishing || isProcessing}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-all disabled:opacity-50"
            >
              {isFinishing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PhoneOff className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">End Interview</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-4xl mx-auto w-full">
        {/* Microphone Visualizer */}
        <div className="relative flex items-center justify-center mb-10">
          {isRecording && (
            <>
              <div className="absolute w-44 h-44 bg-emerald-500/10 rounded-full animate-pulse-ring" />
              <div className="absolute w-56 h-56 bg-emerald-500/5 rounded-full animate-pulse-ring" style={{ animationDelay: "0.5s" }} />
            </>
          )}
          <div
            className={`z-10 w-36 h-36 rounded-full flex flex-col items-center justify-center border-4 transition-all duration-500 ${
              isRecording
                ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20"
                : isProcessing
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-zinc-800 bg-zinc-900"
            }`}
          >
            {isProcessing ? (
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            ) : isRecording ? (
              <Mic className="w-8 h-8 text-emerald-400 animate-pulse" />
            ) : (
              <Mic className="w-8 h-8 text-zinc-600" />
            )}
            <span
              className={`text-xs font-medium mt-2 ${
                isRecording
                  ? "text-emerald-400"
                  : isProcessing
                    ? "text-amber-400"
                    : "text-zinc-500"
              }`}
            >
              {isRecording
                ? "Recording..."
                : isProcessing
                  ? "Processing..."
                  : "Ready"}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4 mb-10">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={isProcessing}
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full font-semibold hover:from-emerald-500 hover:to-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
            >
              <Mic className="w-5 h-5" />
              Speak Your Answer
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-8 py-4 bg-red-500/10 text-red-400 border border-red-500/40 rounded-full font-semibold hover:bg-red-500/20 transition-all"
            >
              <Square className="w-5 h-5 fill-current" />
              Stop & Submit
            </button>
          )}
        </div>

        {/* Transcript */}
        <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 max-h-80 overflow-y-auto">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 border-b border-zinc-800 pb-2">
            Live Transcript
          </h3>

          {transcript.length === 0 && !isProcessing && (
            <p className="text-zinc-600 italic text-sm text-center py-8">
              The interview transcript will appear here...
            </p>
          )}

          <div className="space-y-4">
            {transcript.map((turn, index) => (
              <div
                key={index}
                className={`flex gap-3 animate-fade-in ${
                  turn.speaker === "USER" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    turn.speaker === "AI"
                      ? "bg-emerald-500/20"
                      : "bg-zinc-800"
                  }`}
                >
                  {turn.speaker === "AI" ? (
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                </div>
                <div
                  className={`max-w-[75%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                    turn.speaker === "AI"
                      ? "bg-zinc-800/60 border border-zinc-700/50 text-zinc-200 rounded-tl-md"
                      : "bg-emerald-500/10 border border-emerald-500/20 text-zinc-200 rounded-tr-md"
                  }`}
                >
                  {turn.text}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="flex items-center gap-2 text-zinc-500 text-sm italic px-3.5 py-3 bg-zinc-800/30 rounded-2xl rounded-tl-md">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI is thinking...
                </div>
              </div>
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
