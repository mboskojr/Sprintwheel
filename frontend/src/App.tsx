import {Routes, Route, Navigate} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProductOwnerPage from "./pages/ProductOwnerPage";
import RoleOptionsPage from "./pages/RoleOptionsPage";
import ScrumFacilPage from "./pages/ScrumFacilPage";
import type { JSX } from "react/jsx-dev-runtime"; //added quick fix

function App(): JSX.Element {
  return (
    <Routes>
        {/* Default: send site root to login */}
      <Route path="/" element={<Navigate to="/login" replace/>} />
        {/* Define routes for the app */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/product-owner" element={<ProductOwnerPage />} />
      <Route path="/role-options" element={<RoleOptionsPage />} />
      <Route path="/scrum-facilitator" element={<ScrumFacilPage />} />
      
    </Routes>
  );
}

export default App;