import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import {
  Mic,
  Square,
  Loader2,
  PhoneOff,
  Zap,
  User as UserIcon,
} from "lucide-react";

const formatTime = (ms) => {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export default function InterviewRoom() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [interview, setInterview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [remainingMs, setRemainingMs] = useState(null);
  const [timerWarning, setTimerWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasConsented, setHasConsented] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const transcriptEndRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const timerExpiresAtRef = useRef(null);
  const webcamStreamRef = useRef(null);
  const snapshotIntervalRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Start local countdown
  useEffect(() => {
    if (timerExpiresAtRef.current && hasConsented) {
      timerIntervalRef.current = setInterval(() => {
        const remaining = timerExpiresAtRef.current - Date.now();
        setRemainingMs(remaining);
        if (remaining <= 120000) setTimerWarning(true);
        if (remaining <= 0) {
          clearInterval(timerIntervalRef.current);
          handleTimeUp();
        }
      }, 1000);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [hasConsented, interview?.status]);

  const startInterviewFlow = async () => {
    setIsProcessing(true);
    try {
      const res = await api.post('/interview/start', { interviewId });
      const { interview: updatedInterview, firstTurn } = res.data.data;
      
      setInterview(updatedInterview);
      setTranscript([{ speaker: "AI", text: firstTurn.text }]);

      if (updatedInterview.timerExpiresAt) {
        timerExpiresAtRef.current = new Date(updatedInterview.timerExpiresAt).getTime();
      }

      if (firstTurn.audioUrl) {
        const audio = new Audio(firstTurn.audioUrl);
        audio.play().catch(console.error);
      }
    } catch (error) {
      console.error("Failed to start interview:", error);
      toast.error("Failed to start interview");
    } finally {
      setIsProcessing(false);
    }
  };

  // Load interview details
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

          if (data.status === "IN_PROGRESS") {
            const lastTurn = data.turns[data.turns.length - 1];
            if (lastTurn.speaker === "AI" && lastTurn.audioUrl) {
              const audio = new Audio(lastTurn.audioUrl);
              audio.play().catch(console.error);
            }
          }
        }

        if (data.status === "COMPLETED") {
          navigate(`/interview/${interviewId}/results`, { replace: true });
          return;
        }

        if (data.timerExpiresAt) {
          timerExpiresAtRef.current = new Date(data.timerExpiresAt).getTime();
        }

        if (data.interviewType !== "JOB") {
          setHasConsented(true);
          if (data.status === "PENDING") {
            startInterviewFlow();
          }
        }
      } catch (error) {
        console.error("Failed to load interview:", error);
        toast.error("Failed to load interview");
      } finally {
        setIsLoading(false);
      }
    };
    loadInterview();
  }, [interviewId, navigate, toast]);

  // Silent webcam proctoring for JOB interviews
  const startWebcamProctoring = useCallback(async () => {
    if (webcamStreamRef.current) return; // Prevent multiple streams in React Strict Mode
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      webcamStreamRef.current = stream;

      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      video.play();
      videoRef.current = video;

      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      canvasRef.current = canvas;

      const captureSnapshot = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext("2d");
        ctx.drawImage(videoRef.current, 0, 0, 640, 480);
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const formData = new FormData();
            formData.append("interviewId", interviewId);
            formData.append("image", blob, "snapshot.jpg");
            api.post("/interview/snapshot", formData).catch(console.error);
          }
        }, "image/jpeg", 0.7);
      };

      const scheduleNext = () => {
        const delay = 30000 + Math.random() * 60000;
        snapshotIntervalRef.current = setTimeout(() => {
          captureSnapshot();
          scheduleNext();
        }, delay);
      };

      snapshotIntervalRef.current = setTimeout(() => {
        captureSnapshot();
        scheduleNext();
      }, 10000 + Math.random() * 10000);

      return true;
    } catch (err) {
      console.error("Webcam access denied:", err);
      throw err;
    }
  }, [interviewId]);

  const stopWebcamProctoring = useCallback(() => {
    if (snapshotIntervalRef.current) clearTimeout(snapshotIntervalRef.current);
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((t) => t.stop());
      webcamStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopWebcamProctoring();
      clearInterval(timerIntervalRef.current);
    };
  }, [stopWebcamProctoring]);

  const forceFinishInterview = async () => {
    if (isFinishing) return;
    setIsFinishing(true);
    stopWebcamProctoring();

    try {
      await api.post(`/interview/${interviewId}/finish`);
      toast.success("Interview finished.");
      navigate(`/interview/${interviewId}/results`);
    } catch (error) {
      console.error("Failed to end interview:", error);
      toast.error("Failed to end interview. Please try again.");
      setIsFinishing(false);
    }
  };

  const handleTimeUp = async () => {
    if (isFinishing) return;
    toast.warning("Time's up! Finishing interview...");
    await forceFinishInterview();
  };

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
      toast.error("Microphone access is required.");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = async () => {
      setIsProcessing(true);
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

      const formData = new FormData();
      formData.append("interviewId", interviewId);
      formData.append("audio", audioBlob, "answer.webm");

      try {
        const res = await api.post("/interview/turn", formData);
        const data = res.data.data;

        setTranscript((prev) => [
          ...prev,
          { speaker: "USER", text: data.userText },
        ]);

        if (data.isComplete) {
          toast.success("Interview completed! Generating report...");
          stopWebcamProctoring();
          navigate(`/interview/${interviewId}/results`);
        } else if (data.turn) {
          setTranscript((prev) => [
            ...prev,
            { speaker: "AI", text: data.turn.text },
          ]);
          if (data.turn.audioUrl) {
            const audio = new Audio(data.turn.audioUrl);
            audio.play().catch(console.error);
          }
        }
      } catch (error) {
        console.error("Turn processing error:", error);
        toast.error("Failed to process your answer. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
  };

  const handleEndInterview = async () => {
    if (!confirm("Are you sure you want to end the interview?")) return;
    await forceFinishInterview();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 text-sm">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (!hasConsented && interview?.interviewType === "JOB") {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserIcon className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold mb-3">Camera Required</h2>
          <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
            This is a proctored job interview. You must enable your camera to continue. 
            Random snapshots will be taken during the interview and shared with the recruiter to verify your identity.
          </p>
          <button
            onClick={async () => {
              try {
                await startWebcamProctoring();
                setHasConsented(true);
                if (interview.status === "PENDING") {
                  startInterviewFlow();
                }
              } catch (err) {
                toast.error("Camera access was denied. You cannot proceed with this interview.");
              }
            }}
            className="w-full bg-white text-zinc-950 font-semibold rounded-xl px-4 py-3 hover:bg-zinc-200 transition-all"
          >
            Enable Camera & Start
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <Zap className="w-4 h-4 text-zinc-950" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">
                {interview?.interviewType === "MOCK" ? "Mock Interview" : "AI Interview"}
              </h1>
              <p className="text-xs text-zinc-500">
                {interview?.application?.job?.title || interview?.targetRole || "Technical Screening"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer */}
            {remainingMs !== null && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-mono text-lg font-bold transition-all ${
                timerWarning
                  ? remainingMs <= 30000
                    ? "text-red-400 border-red-500/40 bg-red-500/10 animate-pulse"
                    : "text-amber-400 border-amber-500/40 bg-amber-500/10"
                  : "text-white border-zinc-700 bg-zinc-900"
              }`}>
                {formatTime(remainingMs)}
              </div>
            )}

            <button
              onClick={handleEndInterview}
              disabled={isFinishing || isProcessing}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-all disabled:opacity-50"
            >
              {isFinishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneOff className="w-4 h-4" />}
              <span className="hidden sm:inline">End</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-4xl mx-auto w-full">
        <div className="relative flex items-center justify-center mb-10">
          {isRecording && (
            <>
              <div className="absolute w-44 h-44 bg-blue-500/10 rounded-full animate-pulse-ring" />
              <div className="absolute w-56 h-56 bg-blue-500/5 rounded-full animate-pulse-ring" style={{ animationDelay: "0.5s" }} />
            </>
          )}
          <div
            className={`z-10 w-36 h-36 rounded-full flex flex-col items-center justify-center border-4 transition-all duration-500 ${
              isRecording
                ? "border-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/20"
                : isProcessing
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-zinc-800 bg-zinc-900"
            }`}
          >
            {isProcessing ? (
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            ) : isRecording ? (
              <Mic className="w-8 h-8 text-blue-400 animate-pulse" />
            ) : (
              <Mic className="w-8 h-8 text-zinc-600" />
            )}
            <span className={`text-xs font-medium mt-2 ${
              isRecording ? "text-blue-400" : isProcessing ? "text-amber-400" : "text-zinc-500"
            }`}>
              {isRecording ? "Recording..." : isProcessing ? "Processing..." : "Ready"}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4 mb-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={isProcessing || isFinishing}
              className="flex items-center gap-2 px-8 py-4 bg-white text-zinc-950 rounded-full font-semibold hover:bg-zinc-200 transition-all disabled:opacity-50 shadow-lg shadow-white/10 hover:shadow-white/20"
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

        <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 max-h-80 overflow-y-auto mt-8">
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
                className={`flex gap-3 animate-fade-in ${turn.speaker === "USER" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  turn.speaker === "AI" ? "bg-blue-500/20" : "bg-zinc-800"
                }`}>
                  {turn.speaker === "AI" ? (
                    <Zap className="w-3.5 h-3.5 text-blue-400" />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                </div>
                <div className={`max-w-[75%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                  turn.speaker === "AI"
                    ? "bg-zinc-800/60 border border-zinc-700/50 text-zinc-200 rounded-tl-md"
                    : "bg-blue-500/10 border border-blue-500/20 text-zinc-200 rounded-tr-md"
                }`}>
                  {turn.text}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
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
