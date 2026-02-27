import {Routes, Route, Navigate} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/layouts/DashboardPage";
import ProductOwnerPage from "./pages/layouts/ProductOwnerPage";
import RoleOptionsPage from "./pages/RoleOptionsPage";
import ScrumFacilPage from "./pages/layouts/ScrumFacilPage";
import type { JSX } from "react/jsx-dev-runtime"; //added quick fix
import CommunicationPage from "./pages/CommunicationPage";
import ToDoPage from "./pages/ToDoPage";
import ProgressPage from "./pages/ProgressPage";
import ProjectDetails from "./pages/ProjectDetails";
import EducationPage from "./pages/EducationPage";
import SettingsPage from "./pages/SettingsPage";
import TeamMemberPage from "./pages/layouts/TeamMemberPage";

function App(): JSX.Element {
  return (
    <Routes>
        {/* Default: send site root to login */}
      <Route path="/" element={<Navigate to="/login" replace/>} />
        {/* Define routes for the app */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/role-options" element={<RoleOptionsPage />} />

      <Route path="/product-owner" element={<ProductOwnerPage />} />
      <Route path="/scrum-facilitator" element={<ScrumFacilPage />} />
      <Route path="/team-member" element={<TeamMemberPage />} />
      
      <Route path="/to-do/planning" element={<ToDoPage />} />
      <Route path="/communication" element={<CommunicationPage />} />
      <Route path="/progress" element={<ProgressPage />} />
      <Route path="/project-details" element={<ProjectDetails />} />
      <Route path="/education" element={<EducationPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    
    </Routes>
  );
}

export default App;