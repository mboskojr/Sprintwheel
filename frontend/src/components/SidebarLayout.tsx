import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode, JSX } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { listProjects, type Project } from "../api/projects";

const styles: Record<string, CSSProperties> = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    width: "100%",
    background: "#0b0f17",
    color: "white",
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    padding: 14,
    background: "#0a0e16",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    transition: "width 0.2s ease",
    overflowY: "auto",
    overflowX: "hidden",
  },
  sidebarTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 8,
  },
  brand: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  collapseBtn: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "white",
    borderRadius: 8,
    padding: "6px 10px",
    cursor: "pointer",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 10,
    cursor: "pointer",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid transparent",
    color: "white",
    userSelect: "none",
  },
  navItemActive: {
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.20)",
  },
  icon: {
    fontSize: 20,
    width: 28,
    textAlign: "center",
    flexShrink: 0,
  },
  navLabel: {
    fontSize: 14,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  sidebarBottom: {
    marginTop: 20,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    paddingTop: 16,
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  selectorBox: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  selectorHeader: {
    fontSize: 11,
    fontWeight: 700,
    opacity: 0.75,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  select: {
    width: "100%",
    background: "#2a2f3a",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "white",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 13,
    outline: "none",
  },
  bottomButton: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "white",
    borderRadius: 10,
    padding: "10px 12px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    textAlign: "left",
  },
  projectBox: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 12,
    wordBreak: "break-all",
    opacity: 0.95,
    cursor: "pointer",
    color: "white",
    textAlign: "left",
  },
  projectIdTitle: {
    fontWeight: 700,
    fontSize: 13,
    marginBottom: 4,
  },
  copyHint: {
    marginTop: 6,
    fontSize: 11,
    opacity: 0.7,
  },
  main: {
    flex: 1,
    padding: 24,
    overflow: "auto",
  },
};

type RoleKey = "product-owner" | "scrum-facilitator" | "developer";

type SidebarItem = {
  icon: string;
  label: string;
  path: string;
};

type NavItemProps = {
  icon: string;
  label: string;
  collapsed: boolean;
  active?: boolean;
  onClick: () => void;
};

function NavItem({
  icon,
  label,
  collapsed,
  active = false,
  onClick,
}: NavItemProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      style={{
        ...styles.navItem,
        ...(active ? styles.navItemActive : {}),
      }}
      aria-current={active ? "page" : undefined}
    >
      <span style={styles.icon}>{icon}</span>
      {!collapsed && <span style={styles.navLabel}>{label}</span>}
    </button>
  );
}

function getRoleMenuItems(basePath: string, role: RoleKey): SidebarItem[] {
  switch (role) {
    case "product-owner":
      return [
        { icon: "📌", label: "Product Owner Home", path: `${basePath}/product-owner-dashboard` },
        { icon: "📝", label: "To-Do / Planning", path: `${basePath}/to-do/planning` },
        { icon: "📧", label: "Communication", path: `${basePath}/communication` },
        { icon: "📊", label: "Progress", path: `${basePath}/progress` },
        { icon: "📁", label: "Project Details", path: `${basePath}/project-details` },
        { icon: "📚", label: "Education", path: `${basePath}/education` },
        { icon: "⚙️", label: "Settings", path: `${basePath}/settings` },
      ];

    case "scrum-facilitator":
      return [
        { icon: "🧭", label: "Scrum Facilitator Home", path: `${basePath}/scrum-facilitator-dashboard` },
        { icon: "📝", label: "To-Do / Planning", path: `${basePath}/to-do/planning` },
        { icon: "📧", label: "Communication", path: `${basePath}/communication` },
        { icon: "📊", label: "Progress", path: `${basePath}/progress` },
        { icon: "📁", label: "Project Details", path: `${basePath}/project-details` },
        { icon: "📚", label: "Education", path: `${basePath}/education` },
        { icon: "⚙️", label: "Settings", path: `${basePath}/settings` },
      ];

    case "developer":
    default:
      return [
        { icon: "💻", label: "Developer Dashboard", path: `${basePath}/developer-dashboard` },
        { icon: "📝", label: "To-Do / Planning", path: `${basePath}/to-do/planning` },
        { icon: "📧", label: "Communication", path: `${basePath}/communication` },
        { icon: "📊", label: "Progress", path: `${basePath}/progress` },
        { icon: "📁", label: "Project Details", path: `${basePath}/project-details` },
        { icon: "📚", label: "Education", path: `${basePath}/education` },
        { icon: "⚙️", label: "Settings", path: `${basePath}/settings` },
      ];
  }
}

function getLandingPathForRole(projectId: string, role: RoleKey): string {
  switch (role) {
    case "product-owner":
      return `/projects/${projectId}/${role}/product-owner-dashboard`;
    case "scrum-facilitator":
      return `/projects/${projectId}/${role}/scrum-facilitator-dashboard`;
    case "developer":
    default:
      return `/projects/${projectId}/${role}/developer-dashboard`;
  }
}

export default function SidebarLayout({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [collapsed, setCollapsed] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"" | "Copied!">("");
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId, role } = useParams<{ projectId: string; role: RoleKey }>();

  const basePath = projectId && role ? `/projects/${projectId}/${role}` : "";

  useEffect(() => {
    listProjects()
      .then((data) => setProjects(data))
      .catch(() => setProjects([]));
  }, []);

  const items = useMemo(() => {
    if (!basePath || !role) return [];
    return getRoleMenuItems(basePath, role);
  }, [basePath, role]);

  async function handleCopyProjectId() {
    if (!projectId) return;

    try {
      await navigator.clipboard.writeText(projectId);
      setCopyStatus("Copied!");
      window.setTimeout(() => setCopyStatus(""), 1500);
    } catch {
      setCopyStatus("");
    }
  }

  function handleProjectSwitch(nextProjectId: string) {
    if (!role || !nextProjectId) return;
    navigate(getLandingPathForRole(nextProjectId, role));
  }

  return (
    <div style={styles.shell}>
      <aside
        style={{
          ...styles.sidebar,
          width: collapsed ? 72 : 240,
        }}
      >
        <div style={styles.sidebarTop}>
          {!collapsed && <h2 style={styles.brand}>SprintWheel</h2>}
          <button
            type="button"
            style={styles.collapseBtn}
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label="toggle sidebar"
          >
            {collapsed ? ">" : "<"}
          </button>
        </div>

        <nav style={styles.nav}>
          {items.map((item) => {
            const active = location.pathname === item.path;

            return (
              <NavItem
                key={item.path}
                icon={item.icon}
                label={item.label}
                collapsed={collapsed}
                active={active}
                onClick={() => navigate(item.path)}
              />
            );
          })}
        </nav>

        <div style={styles.sidebarBottom}>
          {!collapsed && projects.length > 0 && (
            <div style={styles.selectorBox}>
              <div style={styles.selectorHeader}>Project Selector</div>

              <select
                style={styles.select}
                value={projectId ?? ""}
                onChange={(e) => handleProjectSwitch(e.target.value)}
              >
                {projects.map((project) => (
                  <option
                    key={project.id}
                    value={project.id}
                    style={{ backgroundColor: "#2a2f3a", color: "white" }}
                  >
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            style={styles.bottomButton}
            onClick={() => navigate("/new-project")}
          >
            ➕ New Project
          </button>

          {projectId && (
            <button
              type="button"
              style={styles.bottomButton}
              onClick={() => navigate(`/projects/${projectId}/role-options`)}
            >
              🔁 Change Role
            </button>
          )}

          {!collapsed && projectId && (
            <button
              type="button"
              onClick={handleCopyProjectId}
              style={styles.projectBox}
              title="Click to copy project ID"
              aria-label="Copy project ID"
            >
              <div style={styles.projectIdTitle}>Current Project ID</div>
              <div>{projectId}</div>
              <div style={styles.copyHint}>{copyStatus || "Click to copy"}</div>
            </button>
          )}
        </div>
      </aside>

      <main style={styles.main}>{children}</main>
    </div>
  );
}