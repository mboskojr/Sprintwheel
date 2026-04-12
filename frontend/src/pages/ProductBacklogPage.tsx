import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { JSX, CSSProperties } from "react";
import SidebarLayout from "../components/SidebarLayout";
import { useTheme } from "./ThemeContext";
import { api } from "../api/client";

interface Story {
  id: string;
  project_id: string;
  sprint_id: string | null;
  title: string;
  description: string | null;
  points: number | null;
  isDone: boolean;
  priority: number;
  date_completed: string | null;
}

interface PendingDelete {
  id: string;
  title: string;
}

const FIBONACCI_POINTS: number[] = [1, 2, 3, 5, 8, 13, 21, 34];

function normalizePoints(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return 1;
  return FIBONACCI_POINTS.includes(value as (typeof FIBONACCI_POINTS)[number])
    ? value
    : 1;
}

function nextFib(value: number): number {
  const current = normalizePoints(value);
  const index = FIBONACCI_POINTS.indexOf(current);
  return index >= 0 && index < FIBONACCI_POINTS.length - 1
    ? FIBONACCI_POINTS[index + 1]
    : FIBONACCI_POINTS[FIBONACCI_POINTS.length - 1];
}

function prevFib(value: number): number {
  const current = normalizePoints(value);
  const index = FIBONACCI_POINTS.indexOf(current);
  return index > 0 ? FIBONACCI_POINTS[index - 1] : FIBONACCI_POINTS[0];
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
  return data
    .filter((story) => !isPlaceholderStory(story))
    .map((story) => ({
      ...story,
      points: normalizePoints(story.points),
    }));
}

export default function ProductBacklogPage(): JSX.Element {
  const { projectId } = useParams();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPoints, setNewPoints] = useState<number>(1);

  const [storyToDelete, setStoryToDelete] = useState<PendingDelete | null>(null);

  const [savingDoneIds, setSavingDoneIds] = useState<string[]>([]);
  const [savingPointIds, setSavingPointIds] = useState<string[]>([]);

  useEffect(() => {
    if (!projectId) return;
    void fetchBacklog();
  }, [projectId]);

  async function fetchBacklog() {
    if (!projectId) return;

    setLoading(true);
    try {
      const data = await api<Story[]>(`/stories/backlog?project_id=${projectId}`);
      setStories(cleanStories(Array.isArray(data) ? data : []));
    } catch (err) {
      console.error("Error fetching backlog:", err);
      setStories([]);
    } finally {
      setLoading(false);
    }
  }

  async function createBacklogStory() {
    if (!projectId || !newTitle.trim()) return;

    try {
      const createdStory = await api<Story>(`/stories/backlog`, {
        method: "POST",
        body: JSON.stringify({
          project_id: projectId,
          title: newTitle.trim(),
          description: newDescription.trim() || null,
          points: normalizePoints(newPoints),
          priority: 1,
        }),
      });

      setStories((prev) => [
        {
          ...createdStory,
          points: normalizePoints(createdStory.points),
        },
        ...prev,
      ]);

      setNewTitle("");
      setNewDescription("");
      setNewPoints(1);
    } catch (err) {
      console.error("Error creating backlog story:", err);
    }
  }

  async function syncStoryUpdate(
    storyId: string,
    updates: Partial<Pick<Story, "title" | "description" | "points" | "priority" | "isDone">>,
    previousStories: Story[]
  ) {
    try {
      const payload = {
        ...updates,
        ...(updates.points !== undefined
          ? { points: normalizePoints(updates.points) }
          : {}),
      };

      const updatedStory = await api<Story>(`/stories/${storyId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      setStories((prev) =>
        prev.map((story) =>
          story.id === storyId
            ? { ...updatedStory, points: normalizePoints(updatedStory.points) }
            : story
        )
      );
    } catch (err) {
      console.error("Error updating story:", err);
      setStories(previousStories);
    }
  }

  function updateStoryOptimistically(
    storyId: string,
    updates: Partial<Pick<Story, "title" | "description" | "points" | "priority" | "isDone">>
  ) {
    const previousStories = stories.map((story) => ({ ...story }));

    const normalizedUpdates = {
      ...updates,
      ...(updates.points !== undefined
        ? { points: normalizePoints(updates.points) }
        : {}),
    };

    setStories((prev) =>
      prev.map((story) =>
        story.id === storyId ? { ...story, ...normalizedUpdates } : story
      )
    );

    void syncStoryUpdate(storyId, normalizedUpdates, previousStories);
  }

  async function toggleDone(storyId: string, checked: boolean) {
    if (savingDoneIds.includes(storyId)) return;

    const previousStories = stories.map((story) => ({ ...story }));

    setSavingDoneIds((prev) => [...prev, storyId]);
    setStories((prev) =>
      prev.map((story) =>
        story.id === storyId ? { ...story, isDone: checked } : story
      )
    );

    try {
      const updatedStory = await api<Story>(`/stories/${storyId}`, {
        method: "PATCH",
        body: JSON.stringify({ isDone: checked }),
      });

      setStories((prev) =>
        prev.map((story) =>
          story.id === storyId
            ? { ...updatedStory, points: normalizePoints(updatedStory.points) }
            : story
        )
      );
    } catch (err) {
      console.error("Error updating done status:", err);
      setStories(previousStories);
    } finally {
      setSavingDoneIds((prev) => prev.filter((id) => id !== storyId));
    }
  }

  async function changePoints(storyId: string, direction: "up" | "down") {
    if (savingPointIds.includes(storyId)) return;

    const story = stories.find((item) => item.id === storyId);
    if (!story) return;

    const currentPoints = normalizePoints(story.points);
    const nextPoints = direction === "up" ? nextFib(currentPoints) : prevFib(currentPoints);

    if (nextPoints === currentPoints) return;

    const previousStories = stories.map((item) => ({ ...item }));

    setSavingPointIds((prev) => [...prev, storyId]);
    setStories((prev) =>
      prev.map((item) =>
        item.id === storyId ? { ...item, points: nextPoints } : item
      )
    );

    try {
      const updatedStory = await api<Story>(`/stories/${storyId}`, {
        method: "PATCH",
        body: JSON.stringify({ points: nextPoints }),
      });

      setStories((prev) =>
        prev.map((item) =>
          item.id === storyId
            ? { ...updatedStory, points: normalizePoints(updatedStory.points) }
            : item
        )
      );
    } catch (err) {
      console.error("Error updating story points:", err);
      setStories(previousStories);
    } finally {
      setSavingPointIds((prev) => prev.filter((id) => id !== storyId));
    }
  }

  async function deleteStory(storyId: string) {
    const previousStories = stories.map((story) => ({ ...story }));

    setStories((prev) => prev.filter((story) => story.id !== storyId));
    setStoryToDelete(null);

    try {
      await api<{ status: string }>(`/stories/${storyId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Error deleting story:", err);
      setStories(previousStories);
    }
  }

  function moveStory(index: number, direction: "up" | "down") {
    const previousStories = stories.map((story) => ({ ...story }));
    const updatedStories = stories.map((story) => ({ ...story }));
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= updatedStories.length) return;

    [updatedStories[index], updatedStories[targetIndex]] = [
      updatedStories[targetIndex],
      updatedStories[index],
    ];

    setStories(updatedStories);
    void reorderStoriesOnBackend(updatedStories, previousStories);
  }

  async function reorderStoriesOnBackend(updatedStories: Story[], previousStories: Story[]) {
    try {
      await api(`/stories/backlog/reorder`, {
        method: "PUT",
        body: JSON.stringify({
          ordered_ids: updatedStories.map((story) => story.id),
        }),
      });
    } catch (err) {
      console.error("Error reordering stories:", err);
      setStories(previousStories);
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
        <h1 style={titleStyle}>Product Backlog</h1>
        <p
          style={{
            ...subtitleStyle,
            color: isDark ? "rgba(255,255,255,0.85)" : "#4b5563",
          }}
        >
          Add and manage product features as backlog items.
        </p>

        <div
          style={{
            ...formCardStyle,
            background: isDark ? "rgba(255,255,255,0.08)" : "#ffffff",
            border: isDark
              ? "1px solid rgba(255,255,255,0.12)"
              : "1px solid rgba(17,24,39,0.08)",
            boxShadow: isDark ? undefined : "0 10px 30px rgba(15,23,42,0.06)",
          }}
        >
          <h2
            style={{
              ...sectionHeadingStyle,
              color: isDark ? "white" : "#111827",
            }}
          >
            Add Product Feature
          </h2>

          <div style={formRowStyle}>
            <input
              style={{
                ...inputStyle,
                background: "#ffffff",
                color: "#111827",
              }}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Feature title"
            />

            <input
              style={{
                ...inputStyle,
                background: "#ffffff",
                color: "#111827",
              }}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Short description"
            />

            <div style={verticalStepperStyle}>
              <div style={verticalStepperValueStyle}>{newPoints}</div>
              <div style={verticalStepperButtonsStyle}>
                <button
                  type="button"
                  style={verticalArrowButtonStyle}
                  onClick={() => setNewPoints((prev) => nextFib(prev))}
                  disabled={newPoints === FIBONACCI_POINTS[FIBONACCI_POINTS.length - 1]}
                >
                  ▲
                </button>
                <button
                  type="button"
                  style={verticalArrowButtonStyle}
                  onClick={() => setNewPoints((prev) => prevFib(prev))}
                  disabled={newPoints === FIBONACCI_POINTS[0]}
                >
                  ▼
                </button>
              </div>
            </div>

            <button style={primaryButtonStyle} onClick={createBacklogStory}>
              Add Feature
            </button>
          </div>
        </div>

        {loading ? (
          <p
            style={{
              ...loadingTextStyle,
              color: isDark ? "white" : "#111827",
            }}
          >
            Loading backlog...
          </p>
        ) : (
          <div
            style={{
              ...tableWrapperStyle,
              background: isDark ? "#111827" : "#ffffff",
              border: isDark
                ? "1px solid rgba(255,255,255,0.10)"
                : "1px solid rgba(17,24,39,0.08)",
              boxShadow: isDark ? undefined : "0 10px 30px rgba(15,23,42,0.06)",
            }}
          >
            <table
              style={{
                ...tableStyle,
                color: isDark ? "#f9fafb" : "#111111",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      ...orderHeaderStyle,
                      borderBottom: isDark ? "2px solid #374151" : "2px solid #ddd",
                    }}
                  >
                    Order
                  </th>
                  <th
                    style={{
                      ...titleHeaderStyle,
                      borderBottom: isDark ? "2px solid #374151" : "2px solid #ddd",
                    }}
                  >
                    Title
                  </th>
                  <th
                    style={{
                      ...descriptionHeaderStyle,
                      borderBottom: isDark ? "2px solid #374151" : "2px solid #ddd",
                    }}
                  >
                    Description
                  </th>
                  <th
                    style={{
                      ...pointsHeaderStyle,
                      borderBottom: isDark ? "2px solid #374151" : "2px solid #ddd",
                    }}
                  >
                    Points
                  </th>
                  <th
                    style={{
                      ...doneHeaderStyle,
                      borderBottom: isDark ? "2px solid #374151" : "2px solid #ddd",
                    }}
                  >
                    Done
                  </th>
                  <th
                    style={{
                      ...reorderHeaderStyle,
                      borderBottom: isDark ? "2px solid #374151" : "2px solid #ddd",
                    }}
                  >
                    Reorder
                  </th>
                  <th
                    style={{
                      ...deleteHeaderStyle,
                      borderBottom: isDark ? "2px solid #374151" : "2px solid #ddd",
                    }}
                  >
                    Delete
                  </th>
                </tr>
              </thead>

              <tbody>
                {stories.map((story, index) => {
                  const isSavingPoints = savingPointIds.includes(story.id);
                  const storyPoints = normalizePoints(story.points);

                  return (
                    <tr key={story.id}>
                      <td
                        style={{
                          ...tdStyle,
                          borderBottom: isDark ? "1px solid #374151" : "1px solid #eee",
                        }}
                      >
                        {index + 1}
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          borderBottom: isDark ? "1px solid #374151" : "1px solid #eee",
                        }}
                      >
                        <input
                          style={cellInputStyle}
                          value={story.title}
                          onChange={(e) => {
                            const nextValue = e.target.value;
                            setStories((prev) =>
                              prev.map((item) =>
                                item.id === story.id ? { ...item, title: nextValue } : item
                              )
                            );
                          }}
                          onBlur={(e) => {
                            const nextValue = e.target.value.trim();
                            if (nextValue && nextValue !== story.title.trim()) {
                              updateStoryOptimistically(story.id, { title: nextValue });
                            } else {
                              setStories((prev) =>
                                prev.map((item) =>
                                  item.id === story.id
                                    ? { ...item, title: nextValue || story.title }
                                    : item
                                )
                              );
                            }
                          }}
                        />
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          borderBottom: isDark ? "1px solid #374151" : "1px solid #eee",
                        }}
                      >
                        <textarea
                          style={descriptionTextareaStyle}
                          value={story.description ?? ""}
                          rows={2}
                          onChange={(e) => {
                            const nextValue = e.target.value;
                            setStories((prev) =>
                              prev.map((item) =>
                                item.id === story.id
                                  ? { ...item, description: nextValue }
                                  : item
                              )
                            );
                          }}
                          onBlur={(e) => {
                            const nextValue = e.target.value;
                            if (nextValue !== (story.description ?? "")) {
                              updateStoryOptimistically(story.id, { description: nextValue });
                            }
                          }}
                        />
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          borderBottom: isDark ? "1px solid #374151" : "1px solid #eee",
                        }}
                      >
                        <div style={verticalStepperStyle}>
                          <div style={verticalStepperValueStyle}>{storyPoints}</div>
                          <div style={verticalStepperButtonsStyle}>
                            <button
                              type="button"
                              style={verticalArrowButtonStyle}
                              onClick={() => void changePoints(story.id, "up")}
                              disabled={
                                isSavingPoints ||
                                storyPoints === FIBONACCI_POINTS[FIBONACCI_POINTS.length - 1]
                              }
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              style={verticalArrowButtonStyle}
                              onClick={() => void changePoints(story.id, "down")}
                              disabled={
                                isSavingPoints || storyPoints === FIBONACCI_POINTS[0]
                              }
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          borderBottom: isDark ? "1px solid #374151" : "1px solid #eee",
                        }}
                      >
                        <label style={doneCheckboxWrapperStyle}>
                            <input
                                style={checkboxStyle}
                                type="checkbox"
                                checked={story.isDone}
                                onChange={(e) => void toggleDone(story.id, e.target.checked)}
                            />
                        </label>
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          borderBottom: isDark ? "1px solid #374151" : "1px solid #eee",
                        }}
                      >
                        <div style={reorderButtonGroupStyle}>
                          <button
                            style={{
                              ...secondaryButtonStyle,
                              background: "#ffffff",
                              ...(index === 0 ? disabledButtonStyle : {}),
                            }}
                            disabled={index === 0}
                            onClick={() => moveStory(index, "up")}
                          >
                            ↑
                          </button>
                          <button
                            style={{
                              ...secondaryButtonStyle,
                              background: "#ffffff",
                              ...(index === stories.length - 1 ? disabledButtonStyle : {}),
                            }}
                            disabled={index === stories.length - 1}
                            onClick={() => moveStory(index, "down")}
                          >
                            ↓
                          </button>
                        </div>
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          borderBottom: isDark ? "1px solid #374151" : "1px solid #eee",
                        }}
                      >
                        <button
                          style={deleteButtonStyle}
                          onClick={() =>
                            setStoryToDelete({
                              id: story.id,
                              title: story.title,
                            })
                          }
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {stories.length === 0 && (
              <div
                style={{
                  ...emptyStateStyle,
                  color: isDark ? "#d1d5db" : "#666",
                }}
              >
                No backlog items yet. Add your first product feature above.
              </div>
            )}
          </div>
        )}

        {storyToDelete && (
          <div style={modalOverlayStyle}>
            <div
              style={{
                ...modalStyle,
                background: isDark ? "#111827" : "#ffffff",
                color: isDark ? "white" : "#111111",
                border: isDark
                  ? "1px solid rgba(255,255,255,0.10)"
                  : "1px solid rgba(17,24,39,0.08)",
              }}
            >
              <h3
                style={{
                  ...modalTitleStyle,
                  color: isDark ? "white" : "#111",
                }}
              >
                Delete backlog item?
              </h3>
              <p
                style={{
                  ...modalTextStyle,
                  color: isDark ? "#d1d5db" : "#444",
                }}
              >
                Are you sure you want to delete "{storyToDelete.title}"?
              </p>

              <div style={modalButtonRowStyle}>
                <button
                  style={{
                    ...cancelButtonStyle,
                    background: "#ffffff",
                    color: "#111",
                  }}
                  onClick={() => setStoryToDelete(null)}
                >
                  Cancel
                </button>

                <button
                  style={confirmDeleteButtonStyle}
                  onClick={() => void deleteStory(storyToDelete.id)}
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
  background: "#0f172a",
  color: "white",
  padding: "40px",
};

const titleStyle: CSSProperties = {
  textAlign: "center",
  marginBottom: "14px",
  fontSize: "68px",
  fontWeight: 800,
  lineHeight: 1.1,
};

const subtitleStyle: CSSProperties = {
  textAlign: "center",
  marginBottom: "30px",
  color: "rgba(255,255,255,0.85)",
  maxWidth: "1050px",
  marginInline: "auto",
  fontSize: "28px",
  lineHeight: 1.5,
};

const formCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "18px",
  padding: "26px",
  marginBottom: "28px",
};

const sectionHeadingStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "20px",
  fontSize: "40px",
  fontWeight: 700,
};

const formRowStyle: CSSProperties = {
  display: "flex",
  gap: "16px",
  flexWrap: "wrap",
};

const inputStyle: CSSProperties = {
  flex: 1,
  minWidth: "260px",
  padding: "16px 18px",
  borderRadius: "12px",
  border: "none",
  outline: "none",
  fontSize: "24px",
  boxSizing: "border-box",
};

const primaryButtonStyle: CSSProperties = {
  padding: "16px 22px",
  borderRadius: "12px",
  border: "2px solid #93c5fd",
  background: "#7c3aed",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "28px",
  boxShadow: "0 0 0 2px rgba(255,255,255,0.08) inset",
};

const loadingTextStyle: CSSProperties = {
  fontSize: "24px",
  textAlign: "center",
};

const tableWrapperStyle: CSSProperties = {
  background: "white",
  borderRadius: "18px",
  padding: "24px",
  overflowX: "auto",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  color: "#111",
  tableLayout: "fixed",
};

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "18px 14px",
  borderBottom: "2px solid #ddd",
  fontWeight: 700,
  fontSize: "28px",
};

const orderHeaderStyle: CSSProperties = {
  ...thStyle,
  width: "8%",
};

const titleHeaderStyle: CSSProperties = {
  ...thStyle,
  width: "26%",
};

const descriptionHeaderStyle: CSSProperties = {
  ...thStyle,
  width: "30%",
};

const pointsHeaderStyle: CSSProperties = {
  ...thStyle,
  width: "12%",
};

const doneHeaderStyle: CSSProperties = {
  ...thStyle,
  width: "8%",
};

const reorderHeaderStyle: CSSProperties = {
  ...thStyle,
  width: "9%",
};

const deleteHeaderStyle: CSSProperties = {
  ...thStyle,
  width: "12%",
};

const tdStyle: CSSProperties = {
  padding: "18px 14px",
  borderBottom: "1px solid #eee",
  verticalAlign: "middle",
  fontSize: "24px",
};

const cellInputStyle: CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "10px",
  border: "1px solid #ddd",
  fontSize: "24px",
  boxSizing: "border-box",
};

const descriptionTextareaStyle: CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "10px",
  border: "1px solid #ddd",
  fontSize: "24px",
  boxSizing: "border-box",
  resize: "vertical",
  minHeight: "72px",
  fontFamily: "inherit",
  lineHeight: 1.35,
};

const verticalStepperStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "stretch",
  background: "#ffffff",
  border: "1px solid #d1d5db",
  borderRadius: "12px",
  overflow: "hidden",
  minWidth: "86px",
};

const verticalStepperValueStyle: CSSProperties = {
  minWidth: "46px",
  padding: "10px 12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
  fontWeight: 700,
  color: "#111827",
  background: "#ffffff",
};

const verticalStepperButtonsStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  borderLeft: "1px solid #d1d5db",
};

const verticalArrowButtonStyle: CSSProperties = {
  width: "34px",
  height: "25px",
  border: "none",
  background: "#ffffff",
  color: "#111827",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 700,
  lineHeight: 1,
};

const doneCheckboxWrapperStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "52px",
  height: "52px",
};

const checkboxStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  cursor: "pointer",
  accentColor: "#16a34a",
};

const reorderButtonGroupStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
};

const secondaryButtonStyle: CSSProperties = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  background: "white",
  cursor: "pointer",
  fontSize: "22px",
  fontWeight: 700,
};

const disabledButtonStyle: CSSProperties = {
  opacity: 0.45,
  cursor: "not-allowed",
};

const deleteButtonStyle: CSSProperties = {
  padding: "12px 18px",
  borderRadius: "10px",
  border: "none",
  background: "#dc2626",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "24px",
};

const emptyStateStyle: CSSProperties = {
  padding: "24px",
  textAlign: "center",
  color: "#666",
  fontSize: "24px",
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
  background: "white",
  borderRadius: "16px",
  padding: "26px",
  width: "90%",
  maxWidth: "460px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
};

const modalTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "12px",
  color: "#111",
  fontSize: "32px",
};

const modalTextStyle: CSSProperties = {
  color: "#444",
  marginBottom: "24px",
  fontSize: "22px",
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
  fontSize: "20px",
};

const confirmDeleteButtonStyle: CSSProperties = {
  padding: "10px 18px",
  borderRadius: "8px",
  border: "none",
  background: "#dc2626",
  color: "white",
  cursor: "pointer",
  fontSize: "20px",
};