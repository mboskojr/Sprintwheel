import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { me } from "../api/auth";
import { listProjects, type ProjectRole } from "../api/projects";

function roleToUrlKey(role: string): string {
  switch (role) {
    case "Product Owner":
      return "product-owner";
    case "Scrum Facilitator":
      return "scrum-facilitator";
    case "Developer":
    default:
      return "developer";
  }
}

function roleKeyToLanding(roleKey: string): string {
  switch (roleKey) {
    case "product-owner":
      return "product-owner-dashboard";
    case "scrum-facilitator":
      return "scrum-facilitator-dashboard";
    case "developer":
    default:
      return "developer-dashboard";
  }
}

function isValidPrimaryRole(role: string | null | undefined): role is ProjectRole {
  return (
    role === "Product Owner" ||
    role === "Scrum Facilitator" ||
    role === "Developer"
  );
}

export default function GoogleSuccessPage() {
  const navigate = useNavigate();

  useEffect(() => {
    async function finishLogin() {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        navigate("/", { replace: true });
        return;
      }

      localStorage.setItem("token", token);

      try {
        const u = await me(token);
        localStorage.setItem("user", JSON.stringify(u));

        const projects = await listProjects();

        if (!projects.length) {
          navigate("/new-project", { replace: true });
          return;
        }

        const first = projects[0];
        const projectId = first.id;
        const roleFromApi = first.role;

        if (!isValidPrimaryRole(roleFromApi)) {
          navigate(`/projects/${projectId}/role-options`, { replace: true });
          return;
        }

        const roleKey = roleToUrlKey(roleFromApi);
        const landing = roleKeyToLanding(roleKey);

        sessionStorage.removeItem("dashboard_revealed");
        navigate(`/projects/${projectId}/${roleKey}/${landing}`, { replace: true });
      } catch {
        navigate("/", { replace: true });
      }
    }

    finishLogin();
  }, [navigate]);

  return <div style={{ padding: 24 }}>Signing you in with Google...</div>;
}