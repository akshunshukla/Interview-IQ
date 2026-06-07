import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CandidateDashboard from "./pages/CandidateDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import InterviewRoom from "./pages/InterviewRoom";
import InterviewResults from "./pages/InterviewResults";
import MockInterviewSetup from "./pages/MockInterviewSetup";
import JobApplicants from "./pages/JobApplicants";
import ApplicantDetail from "./pages/ApplicantDetail";
import InviteJobView from "./pages/InviteJobView";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 antialiased">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/invite/:code" element={<InviteJobView />} />

        <Route
          path="/dashboard/candidate"
          element={
            <ProtectedRoute role="CANDIDATE">
              <CandidateDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mock-interview/setup"
          element={
            <ProtectedRoute role="CANDIDATE">
              <MockInterviewSetup />
            </ProtectedRoute>
          }
        />

        <Route
          path="/interview/:interviewId"
          element={
            <ProtectedRoute>
              <InterviewRoom />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview/:interviewId/results"
          element={
            <ProtectedRoute>
              <InterviewResults />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/recruiter"
          element={
            <ProtectedRoute role="RECRUITER">
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:jobId/applicants"
          element={
            <ProtectedRoute role="RECRUITER">
              <JobApplicants />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications/:applicationId"
          element={
            <ProtectedRoute role="RECRUITER">
              <ApplicantDetail />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
