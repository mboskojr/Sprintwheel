import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode, JSX } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  listProjects,
  leaveProject,
  type Project,
  type ProjectRole,
} from "../api/projects";
import NotificationBell from "./NotificationBell";
import { useTheme } from "../pages/ThemeContext";

const API_BASE = import.meta.env.VITE_API_URL || "https://sprintwheel.onrender.com";

const styles: Record<string, CSSProperties> = {
  shell: {
    display: "flex",
    height: "100vh",
    width: "100%",
    overflow: "hidden",
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    padding: 20,
    transition: "width 0.2s ease",
    overflowY: "auto",
    overflowX: "hidden",
    height: "100vh",
    flexShrink: 0,
    boxSizing: "border-box",
  },
  sidebarTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 10,
  },
  topLeft: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  brand: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  signedInButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    padding: "13px 14px",
    cursor: "pointer",
    textAlign: "left",
    boxSizing: "border-box",
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7c3aed, #2563eb)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 700,
    color: "white",
    flexShrink: 0,
  },
  signedInTextWrap: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    flex: 1,
  },
  signedInLabel: {
    margin: 0,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  signedInValue: {
    margin: "3px 0 0 0",
    fontSize: 14,
    fontWeight: 600,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  collapseBtn: {
    borderRadius: 8,
    padding: "9px 13px",
    cursor: "pointer",
    flexShrink: 0,
    fontSize: 15,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 16px",
    borderRadius: 12,
    cursor: "pointer",
    userSelect: "none",
  },
  icon: {
    fontSize: 22,
    width: 30,
    textAlign: "center",
    flexShrink: 0,
  },
  navLabel: {
    fontSize: 15,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  sidebarBottom: {
    marginTop: 24,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    paddingTop: 18,
    paddingBottom: 24,
  },
  selectorBox: {
    borderRadius: 12,
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  selectorHeader: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  select: {
    width: "100%",
    borderRadius: 10,
    padding: "12px 14px",
    fontSize: 14,
    outline: "none",
  },
  bottomButton: {
    borderRadius: 12,
    padding: "13px 16px",
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 600,
    textAlign: "left",
  },
  projectBox: {
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: 12,
    wordBreak: "break-all",
    opacity: 0.95,
    cursor: "pointer",
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
  },
  main: {
    flex: 1,
    padding: 24,
    overflowY: "auto",
    height: "100vh",
    minWidth: 0,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 24,
  },
  modalCard: {
    width: "min(720px, 96vw)",
    minHeight: "min(520px, 88vh)",
    borderRadius: 24,
    padding: 28,
    boxShadow: "0 25px 80px rgba(0,0,0,0.45)",
    display: "flex",
    flexDirection: "column",
    position: "relative",
  },
  modalClose: {
    position: "absolute",
    top: 18,
    right: 18,
    borderRadius: 10,
    padding: "8px 12px",
    cursor: "pointer",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    gap: 18,
    marginBottom: 28,
    paddingRight: 56,
  },
  modalAvatar: {
    width: 84,
    height: 84,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7c3aed, #2563eb)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 30,
    fontWeight: 700,
    color: "white",
    flexShrink: 0,
  },
  modalHeaderText: { minWidth: 0 },
  modalTitle: { margin: 0, fontSize: 28, fontWeight: 700 },
  modalSubtitle: { margin: "8px 0 0 0", fontSize: 15 },
  profileGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  profileField: {
    borderRadius: 16,
    padding: 16,
  },
  profileFieldLabel: {
    margin: 0,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  profileFieldValue: {
    margin: "8px 0 0 0",
    fontSize: 16,
    fontWeight: 600,
    wordBreak: "break-word",
  },
};

type RoleKey = "product-owner" | "scrum-facilitator" | "developer";
type SidebarItem = { icon: string; label: string; path: string };
type NavItemProps = {
  icon: string;
  label: string;
  collapsed: boolean;
  active?: boolean;
  onClick: () => void;
  isDark: boolean;
};
type StoredUser = { id?: string; name?: string; email?: string; role?: string };
type ProjectWithJoinCode = Project & { join_code?: string };

function NavItem({
  icon,
  label,
  collapsed,
  active = false,
  onClick,
  isDark,
}: NavItemProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      style={{
        ...styles.navItem,
        background: active
          ? isDark
            ? "rgba(255,255,255,0.14)"
            : "#e5e7eb"
          : isDark
            ? "rgba(255,255,255,0.06)"
            : "#f3f4f6",
        border: active
          ? isDark
            ? "1px solid rgba(255,255,255,0.20)"
            : "1px solid rgba(0,0,0,0.10)"
          : "1px solid transparent",
        color: isDark ? "white" : "#111827",
      }}
      aria-current={active ? "page" : undefined}
    >
      <span style={styles.icon}>{icon}</span>
      {!collapsed && <span style={styles.navLabel}>{label}</span>}
    </button>
  );
}

function projectRoleToRoleKey(role: ProjectRole): RoleKey {
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

function roleKeyToProjectRole(role: RoleKey): ProjectRole {
  switch (role) {
    case "product-owner":
      return "Product Owner";
    case "scrum-facilitator":
      return "Scrum Facilitator";
    case "developer":
    default:
      return "Developer";
  }
}

function getRoleMenuItems(basePath: string, role: RoleKey): SidebarItem[] {
  const commonItems: SidebarItem[] = [
    { icon: "📝", label: "To-Do / Planning", path: `${basePath}/to-do/planning` },
    { icon: "📧", label: "Communication", path: `${basePath}/communication` },
    { icon: "📊", label: "Progress", path: `${basePath}/progress` },
    { icon: "📁", label: "Project Details", path: `${basePath}/project-details` },
    { icon: "🗂️", label: "Product Backlog", path: `${basePath}/product-backlog` },
    { icon: "🏃‍♀️", label: "Sprint Setup", path: `${basePath}/sprint-setup` },
    { icon: "📅", label: "Calendar", path: `${basePath}/calendar` },
    { icon: "📚", label: "Education", path: `${basePath}/education` },
    { icon: "⚙️", label: "Settings", path: `${basePath}/settings` },
  ];

  switch (role) {
    case "product-owner":
      return [
        { icon: "📌", label: "Product Owner Home", path: `${basePath}/product-owner-dashboard` },
        ...commonItems,
      ];
    case "scrum-facilitator":
      return [
        {
          icon: "🧭",
          label: "Scrum Facilitator Home",
          path: `${basePath}/scrum-facilitator-dashboard`,
        },
        ...commonItems,
      ];
    case "developer":
    default:
      return [
        { icon: "💻", label: "Developer Dashboard", path: `${basePath}/developer-dashboard` },
        ...commonItems,
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

export default function SidebarLayout({ children }: { children: ReactNode }): JSX.Element {
  const isIframe = window.self !== window.top;

  if (isIframe) {
    return <>{children}</>;
  }

  const { theme } = useTheme();
  const isDark = theme === "dark";

  const colors = {
    appBg: isDark ? "#0b0f17" : "#f8fafc",
    panelBg: isDark ? "#0a0e16" : "#ffffff",
    text: isDark ? "white" : "#111827",
    mutedText: isDark ? "rgba(255,255,255,0.72)" : "#6b7280",
    labelText: isDark ? "rgba(255,255,255,0.6)" : "#6b7280",
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    borderSoft: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
    borderStrong: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.10)",
    surface: isDark ? "rgba(255,255,255,0.06)" : "#f8fafc",
    surfaceStrong: isDark ? "rgba(255,255,255,0.08)" : "#f3f4f6",
    selectBg: isDark ? "#2a2f3a" : "#ffffff",
    overlay: isDark ? "rgba(0,0,0,0.72)" : "rgba(15,23,42,0.18)",
    modalBg: isDark ? "linear-gradient(180deg, #111827 0%, #0f172a 100%)" : "#ffffff",
    optionBg: isDark ? "#2a2f3a" : "#ffffff",
  };

  const [collapsed, setCollapsed] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"" | "Copied!">("");
  const [projects, setProjects] = useState<ProjectWithJoinCode[]>([]);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { projectId, role } = useParams<{ projectId: string; role: RoleKey }>();

  const currentProject = useMemo(
    () => projects.find((p) => p.id === projectId),
    [projects, projectId]
  );

  const effectiveRole: RoleKey = currentProject?.role
    ? projectRoleToRoleKey(currentProject.role)
    : role ?? "developer";

  const basePath = projectId ? `/projects/${projectId}/${effectiveRole}` : "";

  useEffect(() => {
    listProjects()
      .then((data) => setProjects(data as ProjectWithJoinCode[]))
      .catch(() => setProjects([]));
  }, [projectId]);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return;
    try {
      setUser(JSON.parse(raw));
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (!projectId || !role || !currentProject) return;

    const correctRole = projectRoleToRoleKey(currentProject.role);
    if (role !== correctRole) {
      navigate(getLandingPathForRole(projectId, correctRole), { replace: true });
    }
  }, [projectId, role, currentProject, navigate]);

  const items = useMemo(() => {
    if (!basePath) return [];
    return getRoleMenuItems(basePath, effectiveRole);
  }, [basePath, effectiveRole]);

  const userName = user?.name?.trim() || "User";
  const userEmail = user?.email?.trim() || "No email found";
  const userRole = currentProject?.role || (role ? roleKeyToProjectRole(role) : "No role found");
  const userId = user?.id?.trim() || "No ID found";
  const avatarLetter = userName.charAt(0).toUpperCase() || "U";
  const isCurrentProjectOwner = currentProject?.role === "Product Owner";
  const isLastMember = (currentProject?.active_member_count ?? 0) === 1;
  const mustTransferOwnership = isCurrentProjectOwner && !isLastMember;

  async function handleCopyJoinCode() {
    if (!projectId) return;

    const codeToCopy = currentProject?.join_code || projectId;

    try {
      await navigator.clipboard.writeText(codeToCopy);
      setCopyStatus("Copied!");
      window.setTimeout(() => setCopyStatus(""), 1500);
    } catch {
      setCopyStatus("");
    }
  }

  function handleProjectSwitch(nextProjectId: string) {
    if (!nextProjectId) return;

    const selectedProject = projects.find((p) => p.id === nextProjectId);
    if (!selectedProject) return;

    const nextRole = projectRoleToRoleKey(selectedProject.role);
    navigate(getLandingPathForRole(nextProjectId, nextRole));
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  async function handleJoinByCode() {
    if (!joinCode.trim()) return;

    try {
      setJoining(true);
      setJoinError("");

      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/projects/join-by-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          join_code: joinCode.trim(),
          role: "Developer",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to join project");
      }

      const updatedProjects = (await listProjects()) as ProjectWithJoinCode[];
      setProjects(updatedProjects);

      setJoinCode("");

      const joinedProject = updatedProjects.find((p) => p.id === data.project_id);
      const joinedRole = joinedProject
        ? projectRoleToRoleKey(joinedProject.role)
        : "developer";

      navigate(getLandingPathForRole(data.project_id, joinedRole));
    } catch (err: any) {
      setJoinError(err.message || "Failed to join project");
    } finally {
      setJoining(false);
    }
  }

  async function handleLeaveProject() {
    if (!projectId) return;

    const confirmed = window.confirm("Are you sure you want to leave this project?");
    if (!confirmed) return;

    try {
      setLeaving(true);

      await leaveProject(projectId);

      const updatedProjects = (await listProjects()) as ProjectWithJoinCode[];
      setProjects(updatedProjects);

      if (updatedProjects.length > 0) {
        const fallbackProject = updatedProjects[0];
        const fallbackRole = projectRoleToRoleKey(fallbackProject.role);

        navigate(getLandingPathForRole(fallbackProject.id, fallbackRole), {
          replace: true,
        });
      } else {
        navigate("/new-project", { replace: true });
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to leave project.");
    } finally {
      setLeaving(false);
    }
  }

  return (
    <>
      <div
        style={{
          ...styles.shell,
          background: colors.appBg,
          color: colors.text,
        }}
      >
        <aside
          style={{
            ...styles.sidebar,
            width: collapsed ? 84 : 320,
            background: colors.panelBg,
            borderRight: `1px solid ${colors.border}`,
          }}
        >
          <div style={styles.sidebarTop}>
            <div style={styles.topLeft}>
              {!collapsed && (
                <h2
                  style={{
                    ...styles.brand,
                    color: colors.text,
                  }}
                >
                  SprintWheel
                </h2>
              )}

              {!collapsed && (
                <button
                  type="button"
                  style={{
                    ...styles.signedInButton,
                    background: colors.surfaceStrong,
                    border: `1px solid ${colors.borderStrong}`,
                    color: colors.text,
                  }}
                  onClick={() => setProfileOpen(true)}
                >
                  <div style={styles.avatarCircle}>{avatarLetter}</div>
                  <div style={styles.signedInTextWrap}>
                    <p
                      style={{
                        ...styles.signedInLabel,
                        color: colors.mutedText,
                      }}
                    >
                      Signed in as
                    </p>
                    <p
                      style={{
                        ...styles.signedInValue,
                        color: colors.text,
                      }}
                    >
                      {userEmail}
                    </p>
                  </div>
                </button>
              )}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                alignItems: "center",
              }}
            >
              <button
                type="button"
                style={{
                  ...styles.collapseBtn,
                  background: colors.surfaceStrong,
                  border: `1px solid ${colors.borderStrong}`,
                  color: colors.text,
                }}
                onClick={() => setCollapsed((p) => !p)}
                aria-label="toggle sidebar"
              >
                {collapsed ? ">" : "<"}
              </button>
              <NotificationBell size={48} />
            </div>
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
                  isDark={isDark}
                />
              );
            })}
          </nav>

          <div
            style={{
              ...styles.sidebarBottom,
              borderTop: `1px solid ${colors.border}`,
            }}
          >
            {!collapsed && projects.length > 0 && (
              <div
                style={{
                  ...styles.selectorBox,
                  background: colors.surface,
                  border: `1px solid ${colors.borderSoft}`,
                }}
              >
                <div
                  style={{
                    ...styles.selectorHeader,
                    color: colors.mutedText,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>Project Selector</span>

                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      opacity: 0.8,
                    }}
                  >
                    {projects.length} project{projects.length === 1 ? "" : "s"}
                  </span>
                </div>
                <select
                  style={{
                    ...styles.select,
                    background: colors.selectBg,
                    border: `1px solid ${colors.borderStrong}`,
                    color: colors.text,
                  }}
                  value={projectId ?? ""}
                  onChange={(e) => handleProjectSwitch(e.target.value)}
                >
                  {projects.map((p) => (
                    <option
                      key={p.id}
                      value={p.id}
                      style={{
                        backgroundColor: colors.optionBg,
                        color: colors.text,
                      }}
                    >
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              style={{
                ...styles.bottomButton,
                background: colors.surfaceStrong,
                border: `1px solid ${colors.borderStrong}`,
                color: colors.text,
              }}
              onClick={() => navigate("/new-project")}
            >
              ➕ New Project
            </button>

            {!collapsed && (
              <div
                style={{
                  ...styles.selectorBox,
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  gap: 6,
                }}
              >
                <div
                  style={{
                    ...styles.selectorHeader,
                    color: colors.mutedText,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  🔗 Join Project
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    placeholder="Enter code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleJoinByCode();
                    }}
                    style={{
                      ...styles.select,
                      flex: 1,
                      background: colors.selectBg,
                      border: `1px solid ${colors.borderStrong}`,
                      color: colors.text,
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => void handleJoinByCode()}
                    disabled={joining}
                    style={{
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontWeight: 600,
                      cursor: "pointer",
                      background: "#22c55e",
                      color: "white",
                      opacity: joining ? 0.7 : 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Join
                  </button>
                </div>

                {joinError && (
                  <div style={{ color: "#ef4444", fontSize: 12 }}>{joinError}</div>
                )}
              </div>
            )}

            {projectId && (
              <button
                type="button"
                style={{
                  ...styles.bottomButton,
                  background: colors.surfaceStrong,
                  border: `1px solid ${colors.borderStrong}`,
                  color: colors.text,
                }}
                onClick={() => navigate(`/projects/${projectId}/role-options`)}
              >
                🔁 Change Role
              </button>
            )}

            {projectId && (
              <button
                type="button"
                style={{
                  ...styles.bottomButton,
                  background: mustTransferOwnership ? colors.surfaceStrong : "#ef4444",
                  border: `1px solid ${colors.borderStrong}`,
                  color: mustTransferOwnership ? colors.text : "white",
                  opacity: mustTransferOwnership ? 0.7 : 1,
                  cursor: mustTransferOwnership ? "not-allowed" : "pointer",
                }}
                onClick={mustTransferOwnership ? undefined : () => void handleLeaveProject()}
                disabled={leaving || mustTransferOwnership}
                title={
                  mustTransferOwnership
                    ? "Transfer ownership before leaving the project"
                    : isLastMember && isCurrentProjectOwner
                      ? "Leaving will archive this project"
                      : undefined
                }
              >
                {mustTransferOwnership
                  ? "Transfer Ownership to Leave"
                  : leaving
                    ? "Leaving..."
                    : isLastMember && isCurrentProjectOwner
                      ? "🚪 Leave Project (Will Archive)"
                      : "🚪 Leave Project"}
              </button>
            )}

            {!collapsed && projectId && (
              <button
                type="button"
                onClick={() => void handleCopyJoinCode()}
                title="Click to copy project join code"
                style={{
                  ...styles.projectBox,
                  background: colors.surface,
                  border: `1px solid ${colors.borderSoft}`,
                  color: colors.text,
                }}
              >
                <div style={styles.projectIdTitle}>Project Join Code</div>
                <div>{currentProject?.join_code || projectId}</div>
                <div
                  style={{
                    ...styles.copyHint,
                    color: colors.mutedText,
                  }}
                >
                  {copyStatus || "Click to copy"}
                </div>
              </button>
            )}

            <button
              type="button"
              style={{
                ...styles.bottomButton,
                marginTop: 6,
                background: colors.surfaceStrong,
                border: `1px solid ${colors.borderStrong}`,
                color: colors.text,
              }}
              onClick={logout}
            >
              🚪 Logout
            </button>
          </div>
        </aside>

        <main
          style={{
            ...styles.main,
            background: colors.appBg,
            color: colors.text,
          }}
        >
          {children}
        </main>
      </div>

      {profileOpen && (
        <div
          style={{
            ...styles.modalOverlay,
            background: colors.overlay,
          }}
          onClick={() => setProfileOpen(false)}
        >
          <div
            style={{
              ...styles.modalCard,
              background: colors.modalBg,
              border: `1px solid ${colors.borderSoft}`,
              color: colors.text,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              style={{
                ...styles.modalClose,
                background: colors.surfaceStrong,
                border: `1px solid ${colors.borderStrong}`,
                color: colors.text,
              }}
              onClick={() => setProfileOpen(false)}
            >
              ✕
            </button>

            <div style={styles.modalHeader}>
              <div style={styles.modalAvatar}>{avatarLetter}</div>
              <div style={styles.modalHeaderText}>
                <h2
                  style={{
                    ...styles.modalTitle,
                    color: colors.text,
                  }}
                >
                  {userName}
                </h2>
                <p
                  style={{
                    ...styles.modalSubtitle,
                    color: colors.mutedText,
                  }}
                >
                  Account overview
                </p>
              </div>
            </div>

            <div style={styles.profileGrid}>
              {[
                ["Name", userName],
                ["Email", userEmail],
                ["Role", userRole],
                ["User ID", userId],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    ...styles.profileField,
                    background: colors.surface,
                    border: `1px solid ${colors.borderSoft}`,
                  }}
                >
                  <p
                    style={{
                      ...styles.profileFieldLabel,
                      color: colors.labelText,
                    }}
                  >
                    {label}
                  </p>
                  <p
                    style={{
                      ...styles.profileFieldValue,
                      color: colors.text,
                    }}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}