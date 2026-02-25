import {Routes, Route, Navigate} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProductOwnerPage from "./pages/ProductOwnerPage";
import type { JSX } from "react/jsx-dev-runtime"; //added quick fix

function App(): JSX.Element {
  return (
    <Routes>
        <Route path="/" element={<Navigate to="/product-owner" />} />
      {/* <Route path="/" element={<Navigate to="/login" />} /> */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/product-owner" element={<ProductOwnerPage />} />
        <Route path="*" element={<Navigate to="/product-owner" />} />
    </Routes>
  );
}

export default App;