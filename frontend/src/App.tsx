import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/layouts/DashboardPage";
import ProductOwnerPage from "./pages/layouts/ProductOwnerPage";
import RoleOptionsPage from "./pages/RoleOptionsPage";
import ScrumFacilitatorPage from "./pages/layouts/ScrumFacilitatorPage";
import type { JSX } from "react/jsx-dev-runtime";
import CommunicationPage from "./pages/CommunicationPage";
import ToDoPage from "./pages/ToDoPage";
import ProgressPage from "./pages/ProgressPage";
import ProjectDetails from "./pages/ProjectDetails";
import EducationPage from "./pages/EducationPage";
import SettingsPage from "./pages/SettingsPage";
import BackendDebug from "./pages/BackendDebug";
import NewProject from "./pages/NewProject";
import ProductBacklogPage from "./pages/ProductBacklogPage";
import CalendarPage from "./pages/CalendarPage";
import { ThemeProvider } from "./pages/ThemeContext";
import ScrumExamPage from "./pages/ScrumExamPage";
import ScrumGuidePage from "./pages/ScrumGuidePage";
import ScrumRolesPage from "./pages/ScrumRolesPage";
import ScrumEventsPage from "./pages/ScrumEventsPage";
import ScrumArtifactsPage from "./pages/ScrumArtifactsPage";
import { waitForBackendReady } from "./utils/backendReady";
import BackendBootScreen from "./components/BackendBootScreen";

function App(): JSX.Element {
  const [backendReady, setBackendReady] = useState(false);
  const [checkingBackend, setCheckingBackend] = useState(true);

  const runBackendCheck = async () => {
    setCheckingBackend(true);

    const ready = await waitForBackendReady();

    setBackendReady(ready);
    setCheckingBackend(false);
  };

  useEffect(() => {
    void runBackendCheck();
  }, []);

  if (checkingBackend) {
    return <BackendBootScreen />;
  }

  if (!backendReady) {
    return <BackendBootScreen timedOut onRetry={runBackendCheck} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        path="*"
        element={
          <ThemeProvider>
            <Routes>
              <Route path="/new-project" element={<NewProject />} />
              <Route path="/backend-debug" element={<BackendDebug />} />
              <Route
                path="/projects/:projectId/role-options"
                element={<RoleOptionsPage />}
              />
              <Route
                path="/projects/:projectId/:role/developer-dashboard"
                element={<DashboardPage />}
              />
              <Route
                path="/projects/:projectId/:role/product-owner-dashboard"
                element={<ProductOwnerPage />}
              />
              <Route
                path="/projects/:projectId/:role/scrum-facilitator-dashboard"
                element={<ScrumFacilitatorPage />}
              />
              <Route
                path="/projects/:projectId/:role/to-do/planning"
                element={<ToDoPage />}
              />
              <Route
                path="/projects/:projectId/:role/communication"
                element={<CommunicationPage />}
              />
              <Route
                path="/projects/:projectId/:role/progress"
                element={<ProgressPage />}
              />
              <Route
                path="/projects/:projectId/:role/project-details"
                element={<ProjectDetails />}
              />
              <Route
                path="/projects/:projectId/:role/education"
                element={<EducationPage />}
              />
              <Route
                path="/projects/:projectId/:role/settings"
                element={<SettingsPage />}
              />
              <Route
                path="/projects/:projectId/:role/product-backlog"
                element={<ProductBacklogPage />}
              />
              <Route
                path="/projects/:projectId/:role/calendar"
                element={<CalendarPage />}
              />
              <Route
                path="/projects/:projectId/:role/scrum-exam"
                element={<ScrumExamPage />}
              />
              <Route
                path="/projects/:projectId/:role/scrum-guide"
                element={<ScrumGuidePage />}
              />
              <Route
                path="/projects/:projectId/:role/scrum-roles"
                element={<ScrumRolesPage />}
              />
              <Route
                path="/projects/:projectId/:role/scrum-events"
                element={<ScrumEventsPage />}
              />
              <Route
                path="/projects/:projectId/:role/scrum-artifacts"
                element={<ScrumArtifactsPage />}
              />
            </Routes>
          </ThemeProvider>
        }
      />
    </Routes>
  );
}

export default App;