import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import NewRequestPage from "./pages/NewRequestPage";
import ApprovePage from "./pages/ApprovePage";
import RequestDetailsPage from "./pages/RequestDetailsPage";
import PrintPage from "./pages/PrintPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";

export default function App() {
  return (
    <Routes>
      {/* HR login */}
      <Route path="/login" element={<LoginPage />} />

      {/* HR protected pages */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests/new"
        element={
          <ProtectedRoute>
            <NewRequestPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests/:id"
        element={
          <ProtectedRoute>
            <RequestDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests/:id/print"
        element={
          <ProtectedRoute>
            <PrintPage />
          </ProtectedRoute>
        }
      />

      {/* Approver token page (public, no login) */}
      <Route path="/approve/:token" element={<ApprovePage />} />

      {/* Default */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<div style={{ padding: 20 }}>404 Not Found</div>} />
	  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
	  <Route path="/terms-of-service" element={<TermsOfServicePage />} />
    </Routes>
  );
}