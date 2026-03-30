import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode, JSX } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { listProjects, type Project } from "../api/projects";
import NotificationBell from "./NotificationBell";

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
    padding: 20,
    background: "#0a0e16",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    transition: "width 0.2s ease",
    overflowY: "auto",
    overflowX: "hidden",
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
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "white",
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
    opacity: 0.7,
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
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "white",
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
    borderTop: "1px solid rgba(255,255,255,0.08)",
    flex: 1,
  },
  selectorBox: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12,
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  selectorHeader: {
    fontSize: 12,
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
    padding: "12px 14px",
    fontSize: 14,
    outline: "none",
  },
  bottomButton: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "white",
    borderRadius: 12,
    padding: "13px 16px",
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 600,
    textAlign: "left",
  },
  projectBox: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12,
    padding: "12px 14px",
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
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.72)",
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
    background: "linear-gradient(180deg, #111827 0%, #0f172a 100%)",
    border: "1px solid rgba(255,255,255,0.12)",
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
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "white",
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
  modalSubtitle: { margin: "8px 0 0 0", fontSize: 15, color: "rgba(255,255,255,0.72)" },
  profileGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  profileField: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
  },
  profileFieldLabel: {
    margin: 0,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.6)",
  },
  profileFieldValue: { margin: "8px 0 0 0", fontSize: 16, fontWeight: 600, wordBreak: "break-word" },
};

type RoleKey = "product-owner" | "scrum-facilitator" | "developer";
type SidebarItem = { icon: string; label: string; path: string };
type NavItemProps = { icon: string; label: string; collapsed: boolean; active?: boolean; onClick: () => void };
type StoredUser = { id?: string; name?: string; email?: string; role?: string };

function NavItem({ icon, label, collapsed, active = false, onClick }: NavItemProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}
      aria-current={active ? "page" : undefined}
    >
      <span style={styles.icon}>{icon}</span>
      {!collapsed && <span style={styles.navLabel}>{label}</span>}
    </button>
  );
}

function getRoleMenuItems(basePath: string, role: RoleKey): SidebarItem[] {
  const commonItems: SidebarItem[] = [
    { icon: "📝", label: "To-Do / Planning", path: `${basePath}/to-do/planning` },
    { icon: "📧", label: "Communication", path: `${basePath}/communication` },
    { icon: "📊", label: "Progress", path: `${basePath}/progress` },
    { icon: "📁", label: "Project Details", path: `${basePath}/project-details` },
    { icon: "📅", label: "Calendar", path: `${basePath}/calendar` },
    { icon: "📚", label: "Education", path: `${basePath}/education` },
    { icon: "⚙️", label: "Settings", path: `${basePath}/settings` },
  ];
  switch (role) {
    case "product-owner":
      return [{ icon: "📌", label: "Product Owner Home", path: `${basePath}/product-owner-dashboard` }, ...commonItems];
    case "scrum-facilitator":
      return [{ icon: "🧭", label: "Scrum Facilitator Home", path: `${basePath}/scrum-facilitator-dashboard` }, ...commonItems];
    case "developer":
    default:
      return [{ icon: "💻", label: "Developer Dashboard", path: `${basePath}/developer-dashboard` }, ...commonItems];
  }
}

function getLandingPathForRole(projectId: string, role: RoleKey): string {
  switch (role) {
    case "product-owner": return `/projects/${projectId}/${role}/product-owner-dashboard`;
    case "scrum-facilitator": return `/projects/${projectId}/${role}/scrum-facilitator-dashboard`;
    case "developer":
    default: return `/projects/${projectId}/${role}/developer-dashboard`;
  }
}

export default function SidebarLayout({ children }: { children: ReactNode }): JSX.Element {
  const [collapsed, setCollapsed] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"" | "Copied!">("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { projectId, role } = useParams<{ projectId: string; role: RoleKey }>();
  const basePath = projectId && role ? `/projects/${projectId}/${role}` : "";

  useEffect(() => {
    listProjects().then(setProjects).catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return;
    try { setUser(JSON.parse(raw)); } catch { setUser(null); }
  }, []);

  const items = useMemo(() => {
    if (!basePath || !role) return [];
    return getRoleMenuItems(basePath, role);
  }, [basePath, role]);

  const userName = user?.name?.trim() || "User";
  const userEmail = user?.email?.trim() || "No email found";
  const userRole = user?.role?.trim() || role || "No role found";
  const userId = user?.id?.trim() || "No ID found";
  const avatarLetter = userName.charAt(0).toUpperCase() || "U";

  async function handleCopyProjectId() {
    if (!projectId) return;
    try {
      await navigator.clipboard.writeText(projectId);
      setCopyStatus("Copied!");
      window.setTimeout(() => setCopyStatus(""), 1500);
    } catch { setCopyStatus(""); }
  }

  function handleProjectSwitch(nextProjectId: string) {
    if (!role || !nextProjectId) return;
    navigate(getLandingPathForRole(nextProjectId, role));
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <>
      <div style={styles.shell}>
        <aside style={{ ...styles.sidebar, width: collapsed ? 84 : 320 }}>
          <div style={styles.sidebarTop}>
            <div style={styles.topLeft}>
              {!collapsed && <h2 style={styles.brand}>SprintWheel</h2>}
              {!collapsed && (
                <button type="button" style={styles.signedInButton} onClick={() => setProfileOpen(true)}>
                  <div style={styles.avatarCircle}>{avatarLetter}</div>
                  <div style={styles.signedInTextWrap}>
                    <p style={styles.signedInLabel}>Signed in as</p>
                    <p style={styles.signedInValue}>{userEmail}</p>
                  </div>
                </button>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
              <button type="button" style={styles.collapseBtn} onClick={() => setCollapsed(p => !p)} aria-label="toggle sidebar">
                {collapsed ? ">" : "<"}
              </button>
              <NotificationBell size={48} />
            </div>
          </div>

          <nav style={styles.nav}>
            {items.map(item => {
              const active = location.pathname === item.path;
              return (
                <NavItem key={item.path} icon={item.icon} label={item.label} collapsed={collapsed} active={active} onClick={() => navigate(item.path)} />
              );
            })}
          </nav>

          <div style={styles.sidebarBottom}>
            {!collapsed && projects.length > 0 && (
              <div style={styles.selectorBox}>
                <div style={styles.selectorHeader}>Project Selector</div>
                <select style={styles.select} value={projectId ?? ""} onChange={e => handleProjectSwitch(e.target.value)}>
                  {projects.map(p => (
                    <option key={p.id} value={p.id} style={{ backgroundColor: "#2a2f3a", color: "white" }}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
            <button type="button" style={styles.bottomButton} onClick={() => navigate("/new-project")}>➕ New Project</button>
            {projectId && (
              <button type="button" style={styles.bottomButton} onClick={() => navigate(`/projects/${projectId}/role-options`)}>🔁 Change Role</button>
            )}
            {!collapsed && projectId && (
              <button type="button" onClick={handleCopyProjectId} style={styles.projectBox} title="Click to copy project ID">
                <div style={styles.projectIdTitle}>Current Project ID</div>
                <div>{projectId}</div>
                <div style={styles.copyHint}>{copyStatus || "Click to copy"}</div>
              </button>
            )}
            <button type="button" style={{ ...styles.bottomButton, marginTop: 6 }} onClick={logout}>🚪 Logout</button>
          </div>
        </aside>

        <main style={styles.main}>{children}</main>
      </div>

      {profileOpen && (
        <div style={styles.modalOverlay} onClick={() => setProfileOpen(false)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <button type="button" style={styles.modalClose} onClick={() => setProfileOpen(false)}>✕</button>
            <div style={styles.modalHeader}>
              <div style={styles.modalAvatar}>{avatarLetter}</div>
              <div style={styles.modalHeaderText}>
                <h2 style={styles.modalTitle}>{userName}</h2>
                <p style={styles.modalSubtitle}>Account overview</p>
              </div>
            </div>
            <div style={styles.profileGrid}>
              {[["Name", userName], ["Email", userEmail], ["Role", userRole], ["User ID", userId]].map(([label, value]) => (
                <div key={label} style={styles.profileField}>
                  <p style={styles.profileFieldLabel}>{label}</p>
                  <p style={styles.profileFieldValue}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}