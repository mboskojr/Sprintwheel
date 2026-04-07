// src/pages/NewProject.tsx
import { motion } from "framer-motion";
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createProject, joinProject, listProjects } from "../api/projects";
import type { Project } from "../api/projects";
import { useTheme } from "../pages/ThemeContext";

type Status = "idle" | "loading" | "success" | "error";

const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "min(880px, 96vw)",
    borderRadius: 24,
    padding: 28,
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
    position: "relative",
  },
  header: {
    marginBottom: 18,
  },
  title: {
    margin: 0,
    fontSize: 34,
    fontWeight: 800,
    letterSpacing: -0.3,
  },
  subtitle: {
    margin: "10px 0 0 0",
    fontSize: 15,
    lineHeight: 1.5,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 16,
    marginTop: 22,
  },
  panel: {
    borderRadius: 20,
    padding: 18,
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  panelTitleWrap: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    fontSize: 20,
    flexShrink: 0,
  },
  panelTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
  },
  panelDesc: {
    margin: "6px 0 0 0",
    fontSize: 13,
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 12,
    marginTop: 12,
  },
  fieldGroup: {
    display: "grid",
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: 700,
  },
  input: {
    width: "100%",
    maxWidth: 420,
    boxSizing: "border-box",
    borderRadius: 12,
    padding: "12px 12px",
    outline: "none",
    fontSize: 14,
  },
  inputError: {
    border: "1px solid #ff8e8e",
  },
  inlineRow: {
    display: "flex",
    gap: 10,
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  button: {
    borderRadius: 999,
    padding: "12px 16px",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 14,
    whiteSpace: "nowrap",
  },
  buttonDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
  hint: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 1.5,
  },
  error: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 1.5,
  },
  success: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 1.5,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    borderRadius: 999,
    padding: "12px 16px",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 16,
    display: "grid",
    placeItems: "center",
    whiteSpace: "nowrap",
  },
};

export default function NewProject(): React.JSX.Element {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [projectName, setProjectName] = useState("");
  const [sprintDurationInput, setSprintDurationInput] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  useEffect(() => {
    listProjects().then(setProjects).catch(() => setProjects([]));
  }, []);
  const mustCreateProject = projects.length === 0;
  const [createStatus, setCreateStatus] = useState<Status>("idle");
  const [createMsg, setCreateMsg] = useState("");

  const [joinProjectId, setJoinProjectId] = useState("");
  const [joinStatus, setJoinStatus] = useState<Status>("idle");
  const [joinMsg, setJoinMsg] = useState("");

  const isBusy = useMemo(
    () => createStatus === "loading" || joinStatus === "loading",
    [createStatus, joinStatus]
  );

  const trimmedProjectName = projectName.trim();
  const trimmedSprint = sprintDurationInput.trim();

  const projectNameEmpty =
    createStatus === "error" && trimmedProjectName.length === 0;

  const sprintEmpty =
    createStatus === "error" && trimmedSprint.length === 0;

  const sprintInvalid =
    createStatus === "error" &&
    trimmedSprint.length > 0 &&
    (!Number.isInteger(Number(trimmedSprint)) || Number(trimmedSprint) <= 0);

  const joinInputError =
    joinStatus === "error" &&
    (joinMsg.toLowerCase().includes("invalid") ||
      joinMsg.toLowerCase().includes("not found") ||
      joinMsg.toLowerCase().includes("please enter"));

  async function handleCreateProject() {
    if (isBusy) return;

    setCreateStatus("loading");
    setCreateMsg("");
    setJoinStatus("idle");
    setJoinMsg("");

    if (!trimmedProjectName || !trimmedSprint) {
      setCreateStatus("error");
      setCreateMsg("Please fill in all required fields.");
      return;
    }

    const sprintNumber = Number(trimmedSprint);

    if (!Number.isInteger(sprintNumber) || sprintNumber <= 0) {
      setCreateStatus("error");
      setCreateMsg("Please enter a valid whole number for sprint length in days.");
      return;
    }

    try {
      const created = await createProject({
        name: trimmedProjectName,
        sprint_duration: sprintNumber,
      });

      setCreateStatus("success");
      setCreateMsg(`Created project "${created.name}". Redirecting...`);
      navigate(`/projects/${created.id}/role-options`, { replace: true });
    } catch (err: any) {
      setCreateStatus("error");
      setCreateMsg(err?.message || "Could not create the project.");
    }
  }

  async function handleJoinProject() {
    if (isBusy) return;

    const id = joinProjectId.trim();

    if (!id) {
      setJoinStatus("error");
      setJoinMsg("Please enter a Project ID.");
      return;
    }

    setJoinStatus("loading");
    setJoinMsg("");
    setCreateStatus("idle");
    setCreateMsg("");

    try {
      await joinProject(id, { role: "Developer" });

      setJoinStatus("success");
      setJoinMsg('Joined project as "Developer". Redirecting...');
      navigate(`/projects/${id}/role-options`, { replace: true });
    } catch (err: any) {
      const message = String(err?.message || "");
      const lower = message.toLowerCase();
      const status = err?.status;

      if (status === 404 || lower.includes("not found")) {
        setJoinStatus("error");
        setJoinMsg("Project ID is invalid or not found.");
        return;
      }

      if (lower.includes("already")) {
        setJoinStatus("error");
        setJoinMsg("You have already joined this project.");
        return;
      }

      setJoinStatus("error");
      setJoinMsg(message || "Could not join the project.");
    }
  }

  function onJoinKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      void handleJoinProject();
    }
  }

  return (
    <div
      style={{
        ...styles.shell,
        background: isDark ? "#0b0f17" : "#f8fafc",
        color: isDark ? "white" : "#111827",
      }}
    >
      <motion.div
        style={{
          ...styles.card,
          background: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
          border: isDark
            ? "1px solid rgba(255,255,255,0.10)"
            : "1px solid rgba(0,0,0,0.08)",
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <motion.button
          type="button"
          style={{
            ...styles.closeButton,
            background: isDark ? "rgba(255,255,255,0.12)" : "#f3f4f6",
            border: isDark
              ? "1px solid rgba(255,255,255,0.18)"
              : "1px solid rgba(0,0,0,0.08)",
            color: isDark ? "white" : "#111827",
            opacity: mustCreateProject ? 0.5 : 1,
            cursor: mustCreateProject ? "not-allowed" : "pointer",
          }}
          onClick={() => {
            if (!mustCreateProject) {
              navigate(-1);
            }
          }}
          disabled={mustCreateProject}
          aria-label="Close"
          whileHover={!mustCreateProject ? { y: -2 } : undefined}
          whileTap={!mustCreateProject ? { scale: 0.98 } : undefined}
        >
          ×
        </motion.button>

        <div style={styles.header}>
          <h1 style={styles.title}>Projects</h1>
          <p
            style={{
              ...styles.subtitle,
              color: isDark ? "rgba(255,255,255,0.82)" : "#6b7280",
            }}
          >
            Create a new project, or join an existing one with its Project ID.
          </p>
        </div>

        <div style={styles.grid}>
          <div
            style={{
              ...styles.panel,
              background: isDark ? "rgba(255,255,255,0.06)" : "#f8fafc",
              border: isDark
                ? "1px solid rgba(255,255,255,0.12)"
                : "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <div style={styles.panelHeader}>
              <div style={styles.panelTitleWrap}>
                <span
                  style={{
                    ...styles.icon,
                    background: isDark ? "rgba(255,255,255,0.10)" : "#e5e7eb",
                    border: isDark
                      ? "1px solid rgba(255,255,255,0.14)"
                      : "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  ✨
                </span>
                <div>
                  <h2 style={styles.panelTitle}>Create New Project</h2>
                  <p
                    style={{
                      ...styles.panelDesc,
                      color: isDark ? "rgba(255,255,255,0.8)" : "#6b7280",
                    }}
                  >
                    Start a new project and continue to role setup.
                  </p>
                </div>
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.fieldGroup}>
                <label style={styles.label} htmlFor="project-name">
                  Project Name
                </label>
                <input
                  id="project-name"
                  style={{
                    ...styles.input,
                    background: isDark ? "rgba(255,255,255,0.08)" : "#ffffff",
                    border: isDark
                      ? "1px solid rgba(255,255,255,0.14)"
                      : "1px solid rgba(0,0,0,0.10)",
                    color: isDark ? "white" : "#111827",
                    ...(projectNameEmpty ? styles.inputError : {}),
                  }}
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={isBusy}
                />
                {projectNameEmpty && (
                  <div
                    style={{
                      ...styles.error,
                      color: isDark ? "#ffb4b4" : "#b91c1c",
                    }}
                  >
                    Project name cannot be empty.
                  </div>
                )}
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label} htmlFor="sprint-length">
                  Sprint Length in Days
                </label>
                <input
                  id="sprint-length"
                  style={{
                    ...styles.input,
                    background: isDark ? "rgba(255,255,255,0.08)" : "#ffffff",
                    border: isDark
                      ? "1px solid rgba(255,255,255,0.14)"
                      : "1px solid rgba(0,0,0,0.10)",
                    color: isDark ? "white" : "#111827",
                    ...((sprintEmpty || sprintInvalid) ? styles.inputError : {}),
                  }}
                  value={sprintDurationInput}
                  onChange={(e) => setSprintDurationInput(e.target.value)}
                  disabled={isBusy}
                />
                {sprintEmpty && (
                  <div
                    style={{
                      ...styles.error,
                      color: isDark ? "#ffb4b4" : "#b91c1c",
                    }}
                  >
                    Sprint length cannot be empty.
                  </div>
                )}
                {sprintInvalid && (
                  <div
                    style={{
                      ...styles.error,
                      color: isDark ? "#ffb4b4" : "#b91c1c",
                    }}
                  >
                    Please enter a valid whole number for sprint length.
                  </div>
                )}
              </div>

              <motion.button
                type="button"
                style={{
                  ...styles.button,
                  ...(isBusy ? styles.buttonDisabled : {}),
                  width: "fit-content",
                  background: isDark ? "rgba(255,255,255,0.12)" : "#f3f4f6",
                  border: isDark
                    ? "1px solid rgba(255,255,255,0.18)"
                    : "1px solid rgba(0,0,0,0.08)",
                  color: isDark ? "white" : "#111827",
                }}
                onClick={handleCreateProject}
                disabled={isBusy}
                whileHover={isBusy ? undefined : { y: -2 }}
                whileTap={isBusy ? undefined : { scale: 0.98 }}
              >
                {createStatus === "loading" ? "Creating..." : "Create New Project"}
              </motion.button>

              {createStatus === "success" && (
                <div
                  style={{
                    ...styles.success,
                    color: isDark ? "#b9ffcc" : "#166534",
                  }}
                >
                  {createMsg}
                </div>
              )}

              {createStatus === "error" &&
                !projectNameEmpty &&
                !sprintEmpty &&
                !sprintInvalid && (
                  <div
                    style={{
                      ...styles.error,
                      color: isDark ? "#ffb4b4" : "#b91c1c",
                    }}
                  >
                    {createMsg}
                  </div>
                )}

              {createStatus === "idle" && (
                <div
                  style={{
                    ...styles.hint,
                    color: isDark ? "rgba(255,255,255,0.7)" : "#6b7280",
                  }}
                >
                  Enter a project name and sprint length to create your project.
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              ...styles.panel,
              background: isDark ? "rgba(255,255,255,0.06)" : "#f8fafc",
              border: isDark
                ? "1px solid rgba(255,255,255,0.12)"
                : "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <div style={styles.panelHeader}>
              <div style={styles.panelTitleWrap}>
                <span
                  style={{
                    ...styles.icon,
                    background: isDark ? "rgba(255,255,255,0.10)" : "#e5e7eb",
                    border: isDark
                      ? "1px solid rgba(255,255,255,0.14)"
                      : "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  🔗
                </span>
                <div>
                  <h2 style={styles.panelTitle}>Join Project</h2>
                  <p
                    style={{
                      ...styles.panelDesc,
                      color: isDark ? "rgba(255,255,255,0.8)" : "#6b7280",
                    }}
                  >
                    Enter a Project ID to join an existing project.
                  </p>
                </div>
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.fieldGroup}>
                <label style={styles.label} htmlFor="join-project-id">
                  Project ID
                </label>

                <div style={styles.inlineRow}>
                  <input
                    id="join-project-id"
                    style={{
                      ...styles.input,
                      background: isDark ? "rgba(255,255,255,0.08)" : "#ffffff",
                      border: isDark
                        ? "1px solid rgba(255,255,255,0.14)"
                        : "1px solid rgba(0,0,0,0.10)",
                      color: isDark ? "white" : "#111827",
                      ...(joinInputError ? styles.inputError : {}),
                    }}
                    value={joinProjectId}
                    onChange={(e) => setJoinProjectId(e.target.value)}
                    onKeyDown={onJoinKeyDown}
                    disabled={isBusy}
                  />

                  <motion.button
                    type="button"
                    style={{
                      ...styles.button,
                      ...(isBusy ? styles.buttonDisabled : {}),
                      background: isDark ? "rgba(255,255,255,0.12)" : "#f3f4f6",
                      border: isDark
                        ? "1px solid rgba(255,255,255,0.18)"
                        : "1px solid rgba(0,0,0,0.08)",
                      color: isDark ? "white" : "#111827",
                    }}
                    onClick={handleJoinProject}
                    disabled={isBusy}
                    whileHover={isBusy ? undefined : { y: -2 }}
                    whileTap={isBusy ? undefined : { scale: 0.98 }}
                  >
                    {joinStatus === "loading" ? "Joining..." : "Enter"}
                  </motion.button>
                </div>
              </div>

              {joinStatus === "error" && (
                <div
                  style={{
                    ...styles.error,
                    color: isDark ? "#ffb4b4" : "#b91c1c",
                  }}
                >
                  {joinMsg}
                </div>
              )}

              {joinStatus === "success" && (
                <div
                  style={{
                    ...styles.success,
                    color: isDark ? "#b9ffcc" : "#166534",
                  }}
                >
                  {joinMsg}
                </div>
              )}

              {joinStatus === "idle" && (
                <div
                  style={{
                    ...styles.hint,
                    color: isDark ? "rgba(255,255,255,0.7)" : "#6b7280",
                  }}
                >
                  Press <b>Enter</b> to submit quickly.
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}