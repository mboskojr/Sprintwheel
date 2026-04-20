//SprintSetup.tsx
import { useEffect, useMemo, useState, type CSSProperties, type JSX } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SidebarLayout from "../components/SidebarLayout";
import { useTheme } from "./ThemeContext";
import { api } from "../api/client";

interface Story {
  id: string;
  title: string;
  points: number | null;
  sprint_id: string | null;
  description?: string | null;
  isDone?: boolean;
  date_added?: string | null;
  date_completed?: string | null;
}

interface Sprint {
  id: string;
  sprint_number: number;
  sprint_name?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

interface PendingSprintDelete {
  id: string;
  title: string;
}

function isPlaceholderStory(story: Story): boolean {
  const title = story.title.trim().toLowerCase();
  const description = (story.description ?? "").trim().toLowerCase();

  return (
    title === "main board" ||
    title === "main backlog" ||
    title === "product backlog" ||
    title === "main board product" ||
    (title === "main board product" && !description) ||
    (title === "main board" && !description)
  );
}

function cleanStories(data: Story[]): Story[] {
  return data.filter((story) => !isPlaceholderStory(story));
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString();
}

function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getEndDate(start: string, weeks: number): string {
  const [year, month, day] = start.split("-").map(Number);
  const end = new Date(year, month - 1, day);
  end.setDate(end.getDate() + weeks * 7 - 1);

  const endYear = end.getFullYear();
  const endMonth = String(end.getMonth() + 1).padStart(2, "0");
  const endDay = String(end.getDate()).padStart(2, "0");
  return `${endYear}-${endMonth}-${endDay}`;
}

function sprintLabel(sprint?: Pick<Sprint, "sprint_number"> | null): string {
  if (!sprint) return "Sprint";
  return `Sprint ${sprint.sprint_number}`;
}

export default function SprintSetupPage(): JSX.Element {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const { projectId, role } = useParams<{ projectId: string; role: string }>();

  const [stories, setStories] = useState<Story[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [loadingSprints, setLoadingSprints] = useState(false);
  const [creatingSprint, setCreatingSprint] = useState(false);
  const [sprintToDelete, setSprintToDelete] = useState<PendingSprintDelete | null>(null);

  const [startDate, setStartDate] = useState<string>(getLocalDateString());
  const [durationWeeks, setDurationWeeks] = useState<number>(2);

  const [selectedStoryIds, setSelectedStoryIds] = useState<Set<string>>(new Set());
  const [selectedSprintId, setSelectedSprintId] = useState<string>("");

  const activeSprint = useMemo(
    () => sprints.find((s) => s.is_active) ?? null,
    [sprints]
  );

  useEffect(() => {
    if (!projectId) return;
    void Promise.all([fetchStories(), fetchSprints()]);
  }, [projectId]);

  useEffect(() => {
    if (!selectedSprintId && activeSprint) {
      setSelectedSprintId(activeSprint.id);
    }
  }, [activeSprint, selectedSprintId]);

  async function fetchStories() {
    if (!projectId) return;
    setLoadingStories(true);
    try {
      const data = await api<Story[]>(`/stories?project_id=${projectId}`);
      setStories(cleanStories(Array.isArray(data) ? data : []));
    } catch (err) {
      console.error("Error fetching stories:", err);
      setStories([]);
    } finally {
      setLoadingStories(false);
    }
  }

  async function fetchSprints() {
    if (!projectId) return;
    setLoadingSprints(true);
    try {
      const data = await api<Sprint[]>(`/sprints?project_id=${projectId}`);
      const list = Array.isArray(data) ? data : [];
      setSprints(list);

      if (!selectedSprintId && list.length > 0) {
        const preferred = list.find((s) => s.is_active) ?? list[0];
        setSelectedSprintId(preferred.id);
      }
    } catch (err) {
      console.error("Error fetching sprints:", err);
      setSprints([]);
    } finally {
      setLoadingSprints(false);
    }
  }

  const unassignedStories = useMemo(
    () => stories.filter((story) => !story.sprint_id),
    [stories]
  );

  const sprintStories = useMemo(
    () => stories.filter((story) => story.sprint_id === selectedSprintId),
    [stories, selectedSprintId]
  );

  const selectedSprint = useMemo(
    () => sprints.find((s) => s.id === selectedSprintId) ?? null,
    [sprints, selectedSprintId]
  );

  function toggleStorySelection(id: string) {
    setSelectedStoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCreateSprint() {
    if (!projectId) {
      alert("Missing project ID.");
      return;
    }
    if (!startDate) {
      alert("Please choose a start date.");
      return;
    }
    if (durationWeeks < 1) {
      alert("Duration must be at least 1 week.");
      return;
    }

    setCreatingSprint(true);
    try {
      const endDate = getEndDate(startDate, durationWeeks);

      const newSprint = await api<Sprint>("/sprints", {
        method: "POST",
        body: JSON.stringify({
          project_id: projectId,
          start_date: startDate,
          end_date: endDate,
          is_active: sprints.length === 0,
        }),
      });

      setSelectedSprintId(newSprint.id);
      await fetchSprints();

      if (selectedStoryIds.size > 0) {
        await assignSelectedStoriesToSprint(newSprint.id);
      }
    } catch (err: any) {
      console.error("Error creating sprint:", err);
      alert(err?.message || "Could not create sprint.");
    } finally {
      setCreatingSprint(false);
    }
  }

  async function assignSelectedStoriesToSprint(targetSprintId: string) {
    const storyIds = Array.from(selectedStoryIds);
    if (storyIds.length === 0) return;

    try {
      await Promise.all(
        storyIds.map((storyId) =>
          api(`/stories/${storyId}/assign-sprint/${targetSprintId}`, {
            method: "POST",
            body: JSON.stringify({
              date_added: getLocalDateString(),
            }),
          })
        )
      );

      setSelectedStoryIds(new Set());
      await fetchStories();
    } catch (err: any) {
      console.error("Error assigning stories:", err);
      alert(err?.message || "Could not assign stories.");
    }
  }

  async function handleAssignToExistingSprint() {
    if (!selectedSprintId) {
      alert("Choose a sprint first.");
      return;
    }
    await assignSelectedStoriesToSprint(selectedSprintId);
  }

  async function removeStoryFromSprint(storyId: string) {
    try {
      await api(`/stories/${storyId}`, {
        method: "PATCH",
        body: JSON.stringify({
          sprint_id: null,
          date_added: null,
          date_completed: null,
          isDone: false,
        }),
      });

      await fetchStories();
    } catch (err: any) {
      console.error("Error removing story from sprint:", err);
      alert(err?.message || "Could not move story back to backlog.");
    }
  }

  async function activateSprint(sprintId: string) {
    try {
      await Promise.all(
        sprints
          .filter((s) => s.is_active && s.id !== sprintId)
          .map((s) =>
            api(`/sprints/${s.id}`, {
              method: "PATCH",
              body: JSON.stringify({ is_active: false }),
            })
          )
      );

      await api(`/sprints/${sprintId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: true }),
      });

      await fetchSprints();
    } catch (err: any) {
      console.error("Error activating sprint:", err);
      alert(err?.message || "Could not activate sprint.");
    }
  }

  async function closeSprint(sprintId: string) {
    try {
      await api(`/sprints/${sprintId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: false }),
      });
      await fetchSprints();
    } catch (err: any) {
      console.error("Error closing sprint:", err);
      alert(err?.message || "Could not close sprint.");
    }
  }

  async function confirmDeleteSprint(sprintId: string) {
    const storiesInSprint = stories.filter((story) => story.sprint_id === sprintId);

    try {
      await Promise.all(
        storiesInSprint.map((story) =>
          api(`/stories/${story.id}`, {
            method: "PATCH",
            body: JSON.stringify({
              sprint_id: null,
              date_added: null,
              date_completed: null,
              isDone: false,
            }),
          })
        )
      );

      await api(`/sprints/${sprintId}`, {
        method: "DELETE",
      });

      if (selectedSprintId === sprintId) {
        setSelectedSprintId("");
      }

      setSprintToDelete(null);
      await Promise.all([fetchStories(), fetchSprints()]);
    } catch (err: any) {
      console.error("Error deleting sprint:", err);
      alert(err?.message || "Could not delete sprint.");
    }
  }

  return (
    <SidebarLayout>
      <div
        style={{
          ...pageStyle,
          background: isDark ? "#0f172a" : "#f8fafc",
          color: isDark ? "white" : "#111827",
        }}
      >
        <h1 style={titleStyle}>Sprint Workspace</h1>
        <p style={{ ...subtitleStyle, color: isDark ? "rgba(255,255,255,0.85)" : "#475569" }}>
          Create sprints, assign backlog items, move work back to backlog, and manage sprint history.
        </p>

        <div style={{ ...cardStyle, background: isDark ? "rgba(255,255,255,0.08)" : "white" }}>
          <h2 style={sectionHeadingStyle}>Create Sprint</h2>

          <div style={formRowStyle}>
            <div style={inputGroupStyle}>
              <label style={{ ...labelStyle, color: isDark ? "rgba(255,255,255,0.7)" : "#64748b" }}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={{ ...labelStyle, color: isDark ? "rgba(255,255,255,0.7)" : "#64748b" }}>Duration (Weeks)</label>
              <input
                type="number"
                min={1}
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(Number(e.target.value))}
                style={inputStyle}
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>&nbsp;</label>
              <button style={primaryButtonStyle} onClick={handleCreateSprint} disabled={creatingSprint}>
                {creatingSprint ? "Creating..." : "Create Sprint"}
              </button>
            </div>

          </div>
        </div>

        <div style={{ ...cardStyle, background: isDark ? "rgba(255,255,255,0.08)" : "white" }}>
          <h2 style={sectionHeadingStyle}>Existing Sprints</h2>

          {loadingSprints ? (
            <p>Loading sprints...</p>
          ) : sprints.length === 0 ? (
            <p>No sprints yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {sprints.map((sprint) => (
                <div key={sprint.id} style={sprintCardStyle}>
                  <div>
                    <strong>{sprintLabel(sprint)}</strong>
                    <div style={{ opacity: 0.8, marginTop: 6 }}>
                      {formatDate(sprint.start_date)} – {formatDate(sprint.end_date)}
                      {sprint.is_active ? " • Active" : ""}
                    </div>
                  </div>

                  <div style={buttonRowStyle}>
                    <button style={secondaryButtonStyle} onClick={() => setSelectedSprintId(sprint.id)}>
                      View
                    </button>

                    {!sprint.is_active ? (
                      <button style={primaryButtonStyle} onClick={() => void activateSprint(sprint.id)}>
                        Activate
                      </button>
                    ) : (
                      <button style={secondaryButtonStyle} onClick={() => void closeSprint(sprint.id)}>
                        Close
                      </button>
                    )}

                    <button
                      style={dangerButtonStyle}
                      onClick={() =>
                        setSprintToDelete({
                          id: sprint.id,
                          title: sprintLabel(sprint),
                        })
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ ...cardStyle, background: isDark ? "rgba(255,255,255,0.08)" : "white" }}>
          <h2 style={sectionHeadingStyle}>Unassigned Backlog Stories</h2>

          {loadingStories ? (
            <p>Loading stories...</p>
          ) : unassignedStories.length === 0 ? (
            <p>No unassigned stories.</p>
          ) : (
            <>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Pick</th>
                    <th style={thStyle}>Title</th>
                    <th style={thStyle}>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {unassignedStories.map((story) => (
                    <tr key={story.id}>
                      <td style={tdStyle}>
                        <input
                          type="checkbox"
                          checked={selectedStoryIds.has(story.id)}
                          onChange={() => toggleStorySelection(story.id)}
                        />
                      </td>
                      <td style={tdStyle}>{story.title}</td>
                      <td style={tdStyle}>{story.points ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ ...formRowStyle, marginTop: 20 }}>
                <select
                  value={selectedSprintId}
                  onChange={(e) => setSelectedSprintId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select sprint</option>
                  {sprints.map((s) => (
                    <option key={s.id} value={s.id}>
                      {sprintLabel(s)}
                      {s.is_active ? " (Active)" : ""}
                    </option>
                  ))}
                </select>

                <button
                  style={primaryButtonStyle}
                  disabled={selectedStoryIds.size === 0 || !selectedSprintId}
                  onClick={() => void handleAssignToExistingSprint()}
                >
                  Assign Selected Stories
                </button>

                <button
                  style={secondaryButtonStyle}
                  onClick={() => {
                    if (projectId && role) navigate(`/projects/${projectId}/${role}/progress`);
                  }}
                >
                  Go to Progress
                </button>
              </div>
            </>
          )}
        </div>

        <div style={{ ...cardStyle, background: isDark ? "rgba(255,255,255,0.08)" : "white" }}>
          <h2 style={sectionHeadingStyle}>
            {selectedSprint ? `Stories in ${sprintLabel(selectedSprint)}` : "Sprint Stories"}
          </h2>

          {!selectedSprintId ? (
            <p>Select a sprint to view its stories.</p>
          ) : sprintStories.length === 0 ? (
            <p>No stories assigned to this sprint.</p>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Points</th>
                  <th style={thStyle}>Added</th>
                  <th style={thStyle}>Completed</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sprintStories.map((story) => (
                  <tr key={story.id}>
                    <td style={tdStyle}>{story.title}</td>
                    <td style={tdStyle}>{story.points ?? 0}</td>
                    <td style={tdStyle}>{formatDate(story.date_added ?? null)}</td>
                    <td style={tdStyle}>{formatDate(story.date_completed ?? null)}</td>
                    <td style={tdStyle}>
                      <button
                        style={secondaryButtonStyle}
                        onClick={() => void removeStoryFromSprint(story.id)}
                      >
                        Move to Backlog
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {sprintToDelete && (
          <div style={modalOverlayStyle}>
            <div
              style={{
                ...modalStyle,
                background: isDark ? "#111827" : "#ffffff",
                color: isDark ? "white" : "#111111",
              }}
            >
              <h3 style={{ ...modalTitleStyle, color: isDark ? "white" : "#111" }}>
                Delete sprint?
              </h3>
              <p style={{ ...modalTextStyle, color: isDark ? "#d1d5db" : "#444" }}>
                Are you sure you want to delete "{sprintToDelete.title}"?
              </p>

              <div style={modalButtonRowStyle}>
                <button style={cancelButtonStyle} onClick={() => setSprintToDelete(null)}>
                  Cancel
                </button>

                <button
                  style={confirmDeleteButtonStyle}
                  onClick={() => void confirmDeleteSprint(sprintToDelete.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "40px",
};

const titleStyle: CSSProperties = {
  marginBottom: "12px",
  fontSize: "56px",
  fontWeight: 800,
};

const subtitleStyle: CSSProperties = {
  marginBottom: "28px",
  fontSize: "22px",
};

const cardStyle: CSSProperties = {
  borderRadius: "18px",
  padding: "24px",
  marginBottom: "24px",
};

const sprintCardStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  padding: "16px",
  border: "1px solid #cbd5e1",
  borderRadius: "12px",
};

const sectionHeadingStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "18px",
  fontSize: "30px",
  fontWeight: 700,
};

const formRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "16px",
};

const inputStyle: CSSProperties = {
  //flex: 1,
  minWidth: "220px",
  padding: "14px 16px",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  fontSize: "18px",
};

const buttonRowStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const primaryButtonStyle: CSSProperties = {
  //display: "flex", //added
  padding: "14px 18px",
  borderRadius: "12px",
  border: "none",
  background: "#7c3aed",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: CSSProperties = {
  padding: "12px 16px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  background: "white",
  color: "#111827",
  fontWeight: 700,
  cursor: "pointer",
};

const dangerButtonStyle: CSSProperties = {
  padding: "12px 16px",
  borderRadius: "10px",
  border: "none",
  background: "#dc2626",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "14px",
  borderBottom: "2px solid #e2e8f0",
  fontSize: "18px",
};

const tdStyle: CSSProperties = {
  padding: "14px",
  borderBottom: "1px solid #e2e8f0",
  fontSize: "17px",
};

const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle: CSSProperties = {
  borderRadius: "16px",
  padding: "26px",
  width: "90%",
  maxWidth: "460px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
};

const modalTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "12px",
  fontSize: "28px",
};

const modalTextStyle: CSSProperties = {
  marginBottom: "24px",
  fontSize: "18px",
  lineHeight: 1.5,
};

const modalButtonRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
};

const cancelButtonStyle: CSSProperties = {
  padding: "10px 18px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  background: "white",
  color: "#111",
  cursor: "pointer",
  fontSize: "16px",
};

const confirmDeleteButtonStyle: CSSProperties = {
  padding: "10px 18px",
  borderRadius: "8px",
  border: "none",
  background: "#dc2626",
  color: "white",
  cursor: "pointer",
  fontSize: "16px",
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "6px",
  fontSize: "16px",
  fontWeight: 600,
};

const inputGroupStyle: CSSProperties = {
  flex: 1,
  minWidth: "220px",
  display: "flex",
  flexDirection: "column",
};