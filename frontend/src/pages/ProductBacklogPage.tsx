// ProductBacklogPage.tsx
import { useEffect, useMemo, useState } from "react";
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
  date_added: string | null;
  date_completed: string | null;
}

interface Sprint {
  id: string;
  project_id: string;
  sprint_number: number;
  sprint_name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  sprint_velocity: number;
}

interface PendingDelete {
  id: string;
  title: string;
}

const FIBONACCI_POINTS: number[] = [1, 2, 3, 5, 8, 13, 21, 34];

function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString();
}

function normalizePoints(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return 1;
  return FIBONACCI_POINTS.includes(value as (typeof FIBONACCI_POINTS)[number]) ? value : 1;
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

function sortStoriesByPriority(data: Story[]): Story[] {
  return [...data].sort((a, b) => {
    const aPriority = Number.isFinite(a.priority) ? a.priority : Number.MAX_SAFE_INTEGER;
    const bPriority = Number.isFinite(b.priority) ? b.priority : Number.MAX_SAFE_INTEGER;

    if (aPriority !== bPriority) return aPriority - bPriority;

    const aAdded = a.date_added ?? "";
    const bAdded = b.date_added ?? "";
    if (aAdded !== bAdded) return aAdded.localeCompare(bAdded);

    return a.title.localeCompare(b.title);
  });
}

function resequencePriorities(data: Story[]): Story[] {
  return data.map((story, index) => ({
    ...story,
    priority: index + 1,
  }));
}

function cleanStories(data: Story[]): Story[] {
  const cleaned = data
    .filter((story) => !isPlaceholderStory(story))
    .map((story) => ({
      ...story,
      points: normalizePoints(story.points),
      priority:
        typeof story.priority === "number" && Number.isFinite(story.priority)
          ? story.priority
          : Number.MAX_SAFE_INTEGER,
    }));

  return resequencePriorities(sortStoriesByPriority(cleaned));
}

export default function ProductBacklogPage(): JSX.Element {
  const { projectId } = useParams();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [stories, setStories] = useState<Story[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSprints, setLoadingSprints] = useState(true);
  const [reordering, setReordering] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPoints, setNewPoints] = useState<number>(1);

  const [storyToDelete, setStoryToDelete] = useState<PendingDelete | null>(null);

  const [savingDoneIds, setSavingDoneIds] = useState<string[]>([]);
  const [savingPointIds, setSavingPointIds] = useState<string[]>([]);
  const [assigningStoryIds, setAssigningStoryIds] = useState<string[]>([]);
  const [selectedSprintByStory, setSelectedSprintByStory] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!projectId) return;
    void fetchStories();
    void fetchSprints();
  }, [projectId]);

  const sprintMap = useMemo(
    () => Object.fromEntries(sprints.map((sprint) => [sprint.id, sprint])),
    [sprints]
  );

  useEffect(() => {
    if (stories.length === 0 || sprints.length === 0) return;

    const defaultSprintId =
      sprints.find((sprint) => sprint.is_active)?.id ?? sprints[0]?.id ?? "";

    if (!defaultSprintId) return;

    setSelectedSprintByStory((prev) => {
      const next = { ...prev };
      let changed = false;

      for (const story of stories) {
        if (!next[story.id]) {
          next[story.id] = story.sprint_id ?? defaultSprintId;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [stories, sprints]);

  async function fetchStories() {
    if (!projectId) return;

    setLoading(true);
    try {
      const data = await api<Story[]>(`/stories?project_id=${projectId}`);
      setStories(cleanStories(Array.isArray(data) ? data : []));
    } catch (err) {
      console.error("Error fetching stories:", err);
      setStories([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSprints() {
    if (!projectId) return;

    setLoadingSprints(true);
    try {
      const data = await api<Sprint[]>(`/sprints?project_id=${projectId}`);
      setSprints(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching sprints:", err);
      setSprints([]);
    } finally {
      setLoadingSprints(false);
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
          priority: stories.length + 1,
        }),
      });

      const normalizedStory: Story = {
        ...createdStory,
        points: normalizePoints(createdStory.points),
        priority:
          typeof createdStory.priority === "number" && Number.isFinite(createdStory.priority)
            ? createdStory.priority
            : stories.length + 1,
      };

      const nextStories = resequencePriorities(sortStoriesByPriority([...stories, normalizedStory]));
      setStories(nextStories);

      setNewTitle("");
      setNewDescription("");
      setNewPoints(1);

      await persistPriorityOrder(nextStories, stories);
    } catch (err) {
      console.error("Error creating backlog story:", err);
    }
  }

  async function syncStoryUpdate(
    storyId: string,
    updates: Partial<
      Pick<
        Story,
        "title" | "description" | "points" | "priority" | "isDone" | "sprint_id" | "date_added" | "date_completed"
      >
    >,
    previousStories: Story[]
  ) {
    try {
      const payload = {
        ...updates,
        ...(updates.points !== undefined ? { points: normalizePoints(updates.points) } : {}),
      };

      const updatedStory = await api<Story>(`/stories/${storyId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      setStories((prev) =>
        cleanStories(
          prev.map((story) =>
            story.id === storyId
              ? { ...updatedStory, points: normalizePoints(updatedStory.points) }
              : story
          )
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
      ...(updates.points !== undefined ? { points: normalizePoints(updates.points) } : {}),
    };

    setStories((prev) =>
      prev.map((story) => (story.id === storyId ? { ...story, ...normalizedUpdates } : story))
    );

    void syncStoryUpdate(storyId, normalizedUpdates, previousStories);
  }

  async function toggleDone(storyId: string, checked: boolean) {
    if (savingDoneIds.includes(storyId)) return;

    const previousStories = stories.map((story) => ({ ...story }));
    const completedDate = checked ? getLocalDateString() : null;

    setSavingDoneIds((prev) => [...prev, storyId]);

    setStories((prev) =>
      prev.map((story) =>
        story.id === storyId
          ? {
              ...story,
              isDone: checked,
              date_completed: completedDate,
            }
          : story
      )
    );

    try {
      const updatedStory = await api<Story>(`/stories/${storyId}`, {
        method: "PATCH",
        body: JSON.stringify({
          isDone: checked,
          date_completed: completedDate,
        }),
      });

      setStories((prev) =>
        cleanStories(
          prev.map((story) =>
            story.id === storyId
              ? { ...updatedStory, points: normalizePoints(updatedStory.points) }
              : story
          )
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
      prev.map((item) => (item.id === storyId ? { ...item, points: nextPoints } : item))
    );

    try {
      const updatedStory = await api<Story>(`/stories/${storyId}`, {
        method: "PATCH",
        body: JSON.stringify({ points: nextPoints }),
      });

      setStories((prev) =>
        cleanStories(
          prev.map((item) =>
            item.id === storyId
              ? { ...updatedStory, points: normalizePoints(updatedStory.points) }
              : item
          )
        )
      );
    } catch (err) {
      console.error("Error updating story points:", err);
      setStories(previousStories);
    } finally {
      setSavingPointIds((prev) => prev.filter((id) => id !== storyId));
    }
  }

  async function assignStoryToSprint(storyId: string) {
    const sprintId = selectedSprintByStory[storyId];
    if (!sprintId || assigningStoryIds.includes(storyId)) return;

    const previousStories = stories.map((story) => ({ ...story }));
    const addedDate = getLocalDateString();

    setAssigningStoryIds((prev) => [...prev, storyId]);

    try {
      await api<Story>(`/stories/${storyId}/assign-sprint/${sprintId}`, {
        method: "POST",
        body: JSON.stringify({
          date_added: addedDate,
        }),
      });

      setStories((prev) =>
        cleanStories(
          prev.map((story) =>
            story.id === storyId
              ? {
                  ...story,
                  sprint_id: sprintId,
                  date_added: addedDate,
                  date_completed: null,
                  isDone: false,
                }
              : story
          )
        )
      );
    } catch (err) {
      console.error("Error assigning story to sprint:", err);
      setStories(previousStories);
    } finally {
      setAssigningStoryIds((prev) => prev.filter((id) => id !== storyId));
    }
  }

  async function moveStoryToBacklog(storyId: string) {
    const previousStories = stories.map((story) => ({ ...story }));
    try {
      setStories((prev) =>
        cleanStories(
          prev.map((story) =>
            story.id === storyId
              ? {
                  ...story,
                  sprint_id: null,
                  isDone: false,
                  date_added: null,
                  date_completed: null,
                }
              : story
          )
        )
      );

      await api<Story>(`/stories/${storyId}`, {
        method: "PATCH",
        body: JSON.stringify({
          sprint_id: null,
          isDone: false,
          date_added: null,
          date_completed: null,
        }),
      });
    } catch (err) {
      console.error("Error moving story back to backlog:", err);
      setStories(previousStories);
    }
  }

  async function deleteStory(storyId: string) {
    const previousStories = stories.map((story) => ({ ...story }));
    const remainingStories = stories.filter((story) => story.id !== storyId);
    const resequencedStories = resequencePriorities(remainingStories);

    setStories(resequencedStories);
    setStoryToDelete(null);

    try {
      await api<{ status: string }>(`/stories/${storyId}`, {
        method: "DELETE",
      });

      await persistPriorityOrder(resequencedStories, previousStories.filter((story) => story.id !== storyId));
    } catch (err) {
      console.error("Error deleting story:", err);
      setStories(previousStories);
    }
  }

  function moveStory(index: number, direction: "up" | "down") {
    if (reordering) return;

    const previousStories = stories.map((story) => ({ ...story }));
    const updatedStories = stories.map((story) => ({ ...story }));
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= updatedStories.length) return;

    [updatedStories[index], updatedStories[targetIndex]] = [
      updatedStories[targetIndex],
      updatedStories[index],
    ];

    const resequencedStories = resequencePriorities(updatedStories);
    setStories(resequencedStories);
    void persistPriorityOrder(resequencedStories, previousStories);
  }

  async function persistPriorityOrder(updatedStories: Story[], previousStories: Story[]) {
    setReordering(true);

    try {
      const changedStories = updatedStories.filter((story, index) => {
        const previous = previousStories[index];
        return !previous || previous.id !== story.id || previous.priority !== story.priority;
      });

      await Promise.all(
        changedStories.map((story) =>
          api<Story>(`/stories/${story.id}`, {
            method: "PATCH",
            body: JSON.stringify({ priority: story.priority }),
          })
        )
      );

      setStories(cleanStories(updatedStories));
    } catch (err) {
      console.error("Error reordering stories:", err);
      setStories(cleanStories(previousStories));
    } finally {
      setReordering(false);
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
          Add and manage product features here! 
        </p>

        <div
          style={{
            ...formCardStyle,
            background: isDark ? "rgba(255,255,255,0.08)" : "#ffffff",
            border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(17,24,39,0.08)",
          }}
        >
          <h2 style={{ ...sectionHeadingStyle, color: isDark ? "white" : "#111827" }}>
            Add Product Feature
          </h2>

          <div style={formRowStyle}>
            <input
              style={{ ...inputStyle, background: "#ffffff", color: "#111827" }}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Feature title"
            />

            <input
              style={{ ...inputStyle, background: "#ffffff", color: "#111827" }}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Short description"
            />

            <div style={verticalStepperStyle}>
              <div style={verticalStepperValueStyle}>{newPoints}</div>
              <div style={verticalStepperButtonsStyle}>
                <button
                  type="button"
                  aria-label="Increase points"
                  style={verticalArrowButtonStyle}
                  onClick={() => setNewPoints((prev) => nextFib(prev))}
                  disabled={newPoints === FIBONACCI_POINTS[FIBONACCI_POINTS.length - 1]}
                >
                  <span style={stepperArrowIconStyle}>&#9650;</span>
                </button>
                <button
                  type="button"
                  aria-label="Decrease points"
                  style={verticalArrowButtonStyle}
                  onClick={() => setNewPoints((prev) => prevFib(prev))}
                  disabled={newPoints === FIBONACCI_POINTS[0]}
                >
                  <span style={stepperArrowIconStyle}>&#9660;</span>
                </button>
              </div>
            </div>

            <button style={primaryButtonStyle} onClick={createBacklogStory}>
              Add Feature
            </button>
          </div>
        </div>

        {loading ? (
          <p style={{ ...loadingTextStyle, color: isDark ? "white" : "#111827" }}>
            Loading backlog...
          </p>
        ) : (
          <div
            style={{
              ...tableWrapperStyle,
              background: isDark ? "#111827" : "#ffffff",
              border: isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(17,24,39,0.08)",
            }}
          >
            <table style={{ ...tableStyle, color: isDark ? "#f9fafb" : "#111111" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Order</th>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Description</th>
                  <th style={thStyle}>Points</th>
                  <th style={thStyle}>Sprint</th>
                  <th style={thStyle}>Added</th>
                  <th style={thStyle}>Completed</th>
                  <th style={thStyle}>Done</th>
                  <th style={thStyle}>Reorder</th>
                  <th style={thStyle}>Delete</th>
                </tr>
              </thead>

              <tbody>
                {stories.map((story, index) => {
                  const isSavingPoints = savingPointIds.includes(story.id);
                  const isAssigning = assigningStoryIds.includes(story.id);
                  const storyPoints = normalizePoints(story.points);
                  const sprint = story.sprint_id ? sprintMap[story.sprint_id] : null;

                  return (
                    <tr key={story.id}>
                      <td style={tdStyle}>{story.priority}</td>

                      <td style={tdStyle}>
                        <input
                          style={cellInputStyle}
                          value={story.title}
                          onChange={(e) => {
                            const nextValue = e.target.value;
                            setStories((prev) =>
                              prev.map((item) => (item.id === story.id ? { ...item, title: nextValue } : item))
                            );
                          }}
                          onBlur={(e) => {
                            const nextValue = e.target.value.trim();
                            if (nextValue && nextValue !== story.title.trim()) {
                              updateStoryOptimistically(story.id, { title: nextValue });
                            }
                          }}
                        />
                      </td>

                      <td style={tdStyle}>
                        <textarea
                          style={descriptionTextareaStyle}
                          value={story.description ?? ""}
                          rows={2}
                          onChange={(e) => {
                            const nextValue = e.target.value;
                            setStories((prev) =>
                              prev.map((item) =>
                                item.id === story.id ? { ...item, description: nextValue } : item
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

                      <td style={tdStyle}>
                        <div style={verticalStepperStyle}>
                          <div style={verticalStepperValueStyle}>{storyPoints}</div>
                          <div style={verticalStepperButtonsStyle}>
                            <button
                              type="button"
                              style={verticalArrowButtonStyle}
                              onClick={() => void changePoints(story.id, "up")}
                              disabled={isSavingPoints || storyPoints === FIBONACCI_POINTS[FIBONACCI_POINTS.length - 1]}
                            >
                              <span style={stepperArrowIconStyle}>&#9650;</span>
                            </button>
                            <button
                              type="button"
                              style={verticalArrowButtonStyle}
                              onClick={() => void changePoints(story.id, "down")}
                              disabled={isSavingPoints || storyPoints === FIBONACCI_POINTS[0]}
                            >
                              <span style={stepperArrowIconStyle}>&#9660;</span>
                            </button>
                          </div>
                        </div>
                      </td>

                      <td style={tdStyle}>
                        <div style={assignCellStyle}>
                          <select
                            style={sprintSelectStyle}
                            value={selectedSprintByStory[story.id] ?? ""}
                            onChange={(e) =>
                              setSelectedSprintByStory((prev) => ({
                                ...prev,
                                [story.id]: e.target.value,
                              }))
                            }
                            disabled={loadingSprints || isAssigning || sprints.length === 0}
                          >
                            <option value="">Backlog</option>
                            {sprints.map((sprint) => (
                              <option key={sprint.id} value={sprint.id}>
                                {sprint.sprint_name || `Sprint ${sprint.sprint_number}`}
                                {sprint.is_active ? " (Active)" : ""}
                              </option>
                            ))}
                          </select>

                          {story.sprint_id ? (
                            <button
                              type="button"
                              style={secondaryButtonStyle}
                              onClick={() => void moveStoryToBacklog(story.id)}
                            >
                              Remove from Sprint
                            </button>
                          ) : (
                            <button
                              type="button"
                              style={{
                                ...assignButtonStyle,
                                ...(isAssigning || !selectedSprintByStory[story.id] ? disabledButtonStyle : {}),
                              }}
                              disabled={isAssigning || !selectedSprintByStory[story.id]}
                              onClick={() => void assignStoryToSprint(story.id)}
                            >
                              {isAssigning ? "Assigning..." : "Assign"}
                            </button>
                          )}

                          <div style={{ fontSize: "14px", opacity: 0.8 }}>
                            {sprint ? `Assigned to ${sprint.sprint_name || `Sprint ${sprint.sprint_number}`}` : "In backlog"}
                          </div>
                        </div>
                      </td>

                      <td style={tdStyle}>{formatDate(story.date_added)}</td>
                      <td style={tdStyle}>{formatDate(story.date_completed)}</td>

                      <td style={tdStyle}>
                        <label style={doneCheckboxWrapperStyle}>
                          <input
                            style={checkboxStyle}
                            type="checkbox"
                            checked={story.isDone}
                            onChange={(e) => void toggleDone(story.id, e.target.checked)}
                            disabled={!story.sprint_id}
                          />
                        </label>
                      </td>

                      <td style={tdStyle}>
                        <div style={reorderButtonGroupStyle}>
                          <button
                            type="button"
                            style={{
                              ...secondaryButtonStyle,
                              ...(index === 0 || reordering ? disabledButtonStyle : {}),
                            }}
                            disabled={index === 0 || reordering}
                            onClick={() => moveStory(index, "up")}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            style={{
                              ...secondaryButtonStyle,
                              ...(index === stories.length - 1 || reordering ? disabledButtonStyle : {}),
                            }}
                            disabled={index === stories.length - 1 || reordering}
                            onClick={() => moveStory(index, "down")}
                          >
                            ↓
                          </button>
                        </div>
                      </td>

                      <td style={tdStyle}>
                        <button
                          style={deleteButtonStyle}
                          onClick={() => setStoryToDelete({ id: story.id, title: story.title })}
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
              <div style={{ ...emptyStateStyle, color: isDark ? "#d1d5db" : "#666" }}>
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
              }}
            >
              <h3 style={{ ...modalTitleStyle, color: isDark ? "white" : "#111" }}>
                Delete backlog item?
              </h3>
              <p style={{ ...modalTextStyle, color: isDark ? "#d1d5db" : "#444" }}>
                Are you sure you want to delete "{storyToDelete.title}"?
              </p>

              <div style={modalButtonRowStyle}>
                <button style={cancelButtonStyle} onClick={() => setStoryToDelete(null)}>
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
  paddingBottom: "120px",
  overflowY: "auto",
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
  maxWidth: "1050px",
  marginInline: "auto",
  fontSize: "24px",
  lineHeight: 1.5,
};

const formCardStyle: CSSProperties = {
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
  fontSize: "20px",
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
  fontSize: "22px",
};

const loadingTextStyle: CSSProperties = {
  fontSize: "24px",
  textAlign: "center",
};

const tableWrapperStyle: CSSProperties = {
  borderRadius: "18px",
  padding: "24px",
  overflowX: "auto",
  overflowY: "auto",
  maxHeight: "70vh",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
};

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "16px 12px",
  borderBottom: "2px solid #ddd",
  fontWeight: 700,
  fontSize: "18px",
  position: "sticky",
  top: 0,
  background: "#111827",
  zIndex: 1,
};

const tdStyle: CSSProperties = {
  padding: "14px 12px",
  borderBottom: "1px solid #eee",
  verticalAlign: "middle",
  fontSize: "16px",
};

const cellInputStyle: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #ddd",
  fontSize: "16px",
  boxSizing: "border-box",
};

const descriptionTextareaStyle: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #ddd",
  fontSize: "16px",
  boxSizing: "border-box",
  resize: "vertical",
  minHeight: "70px",
  fontFamily: "inherit",
};

const verticalStepperStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
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
  fontSize: "18px",
  fontWeight: 700,
  color: "#111827",
  background: "#ffffff",
};

const verticalStepperButtonsStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  borderLeft: "1px solid #d1d5db",
};

const verticalArrowButtonStyle: CSSProperties = {
  width: "34px",
  flex: 1,
  border: "none",
  background: "#ffffff",
  color: "#111827",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const stepperArrowIconStyle: CSSProperties = {
  fontSize: "11px",
  fontWeight: 800,
  lineHeight: 1,
};

const assignCellStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const sprintSelectStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  fontSize: "15px",
  background: "#ffffff",
  color: "#111827",
};

const assignButtonStyle: CSSProperties = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "none",
  background: "#2563eb",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "15px",
};

const secondaryButtonStyle: CSSProperties = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#111827",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "15px",
};

const doneCheckboxWrapperStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "52px",
  height: "52px",
};

const checkboxStyle: CSSProperties = {
  width: "28px",
  height: "28px",
  cursor: "pointer",
  accentColor: "#16a34a",
};

const reorderButtonGroupStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
};

const disabledButtonStyle: CSSProperties = {
  opacity: 0.45,
  cursor: "not-allowed",
};

const deleteButtonStyle: CSSProperties = {
  padding: "10px 16px",
  borderRadius: "10px",
  border: "none",
  background: "#dc2626",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "15px",
};

const emptyStateStyle: CSSProperties = {
  padding: "24px",
  textAlign: "center",
  fontSize: "20px",
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