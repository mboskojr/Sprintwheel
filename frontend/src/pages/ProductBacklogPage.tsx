import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { JSX, CSSProperties } from "react";

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

export default function ProductBacklogPage(): JSX.Element {
  const { projectId } = useParams();

  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPoints, setNewPoints] = useState(1);

  const [storyToDelete, setStoryToDelete] = useState<PendingDelete | null>(null);

  useEffect(() => {
    if (!projectId) return;
    fetchBacklog();
  }, [projectId]);

  function fetchBacklog() {
    if (!projectId) return;

    setLoading(true);

    fetch(`http://127.0.0.1:8000/stories/backlog?project_id=${projectId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    })
      .then(async res => {
        if (!res.ok) {
          throw new Error(await res.text());
        }
        return res.json();
      })
      .then(data => {
        setStories(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching backlog:", err);
        setLoading(false);
      });
  }

  function createBacklogStory() {
    if (!projectId || !newTitle.trim()) return;

    fetch("http://127.0.0.1:8000/stories/backlog", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({
        project_id: projectId,
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        points: Number.isNaN(newPoints) ? 0 : newPoints,
        priority: 1
      })
    })
      .then(async res => {
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          console.error("Create backlog story failed:", data);
          throw new Error("Failed to create backlog story");
        }

        return data;
      })
      .then(createdStory => {
        setStories(prev => [createdStory, ...prev]);
        setNewTitle("");
        setNewDescription("");
        setNewPoints(1);
      })
      .catch(err => console.error("Error creating backlog story:", err));
  }

  function syncStoryUpdate(
    storyId: string,
    updates: Partial<Pick<Story, "title" | "description" | "points" | "priority" | "isDone">>,
    previousStories: Story[]
  ) {
    fetch(`http://127.0.0.1:8000/stories/${storyId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(updates)
    })
      .then(async res => {
        if (!res.ok) {
          throw new Error(await res.text());
        }
        return res.json();
      })
      .then(updatedStory => {
        setStories(prev =>
          prev.map(story => (story.id === storyId ? updatedStory : story))
        );
      })
      .catch(err => {
        console.error("Error updating story:", err);
        setStories(previousStories);
      });
  }

  function updateStoryOptimistically(
    storyId: string,
    updates: Partial<Pick<Story, "title" | "description" | "points" | "priority" | "isDone">>
  ) {
    const previousStories = [...stories];

    setStories(prev =>
      prev.map(story =>
        story.id === storyId ? { ...story, ...updates } : story
      )
    );

    syncStoryUpdate(storyId, updates, previousStories);
  }

  function deleteStory(storyId: string) {
    const previousStories = [...stories];

    setStories(prev => prev.filter(story => story.id !== storyId));
    setStoryToDelete(null);

    fetch(`http://127.0.0.1:8000/stories/${storyId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    })
      .then(async res => {
        if (!res.ok) {
          throw new Error(await res.text());
        }
      })
      .catch(err => {
        console.error("Error deleting story:", err);
        setStories(previousStories);
      });
  }

  function moveStory(index: number, direction: "up" | "down") {
    const previousStories = [...stories];
    const updatedStories = [...stories];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= updatedStories.length) return;

    [updatedStories[index], updatedStories[targetIndex]] = [
      updatedStories[targetIndex],
      updatedStories[index]
    ];

    setStories(updatedStories);
    reorderStoriesOnBackend(updatedStories, previousStories);
  }

  function reorderStoriesOnBackend(updatedStories: Story[], previousStories: Story[]) {
    fetch("http://127.0.0.1:8000/stories/backlog/reorder", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({
        ordered_ids: updatedStories.map(story => story.id)
      })
    })
      .then(async res => {
        if (!res.ok) {
          throw new Error(await res.text());
        }
        return res.json();
      })
      .catch(err => {
        console.error("Error reordering stories:", err);
        setStories(previousStories);
      });
  }

  return (
    <div style={pageStyle}>
      <h1 style={titleStyle}>Product Backlog</h1>
      <p style={subtitleStyle}>
        Add and manage product features as backlog items. 
      </p>

      <div style={formCardStyle}>
        <h2 style={sectionHeadingStyle}>Add Product Feature</h2>
        <div style={formRowStyle}>
          <input
            style={inputStyle}
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Feature title"
          />
          <input
            style={inputStyle}
            value={newDescription}
            onChange={e => setNewDescription(e.target.value)}
            placeholder="Short description"
          />
          <input
            style={smallInputStyle}
            type="number"
            min={0}
            value={newPoints}
            onChange={e => setNewPoints(Number(e.target.value))}
            placeholder="Points"
          />
          <button style={primaryButtonStyle} onClick={createBacklogStory}>
            Add Feature
          </button>
        </div>
      </div>

      {loading ? (
        <p style={loadingTextStyle}>Loading backlog...</p>
      ) : (
        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={orderHeaderStyle}>Order</th>
                <th style={titleHeaderStyle}>Title</th>
                <th style={descriptionHeaderStyle}>Description</th>
                <th style={pointsHeaderStyle}>Points</th>
                <th style={doneHeaderStyle}>Done</th>
                <th style={reorderHeaderStyle}>Reorder</th>
                <th style={deleteHeaderStyle}>Delete</th>
              </tr>
            </thead>

            <tbody>
              {stories.map((story, index) => (
                <tr key={story.id}>
                  <td style={tdStyle}>{index + 1}</td>

                  <td style={tdStyle}>
                    <input
                      style={cellInputStyle}
                      defaultValue={story.title}
                      onBlur={e => {
                        const nextValue = e.target.value.trim();
                        if (nextValue && nextValue !== story.title) {
                          updateStoryOptimistically(story.id, { title: nextValue });
                        }
                      }}
                    />
                  </td>

                  <td style={tdStyle}>
                    <textarea
                      style={descriptionTextareaStyle}
                      defaultValue={story.description ?? ""}
                      rows={2}
                      onBlur={e => {
                        const nextValue = e.target.value;
                        if (nextValue !== (story.description ?? "")) {
                          updateStoryOptimistically(story.id, { description: nextValue });
                        }
                      }}
                    />
                  </td>

                  <td style={tdStyle}>
                    <input
                      style={pointsInputStyle}
                      type="number"
                      min={0}
                      defaultValue={story.points ?? 0}
                      onBlur={e => {
                        const nextValue = Number(e.target.value);
                        if (!Number.isNaN(nextValue) && nextValue !== (story.points ?? 0)) {
                          updateStoryOptimistically(story.id, { points: nextValue });
                        }
                      }}
                    />
                  </td>

                  <td style={tdStyle}>
                    <label style={doneCheckboxWrapperStyle}>
                      <input
                        style={checkboxStyle}
                        type="checkbox"
                        checked={story.isDone}
                        onChange={e =>
                          updateStoryOptimistically(story.id, {
                            isDone: e.target.checked
                          })
                        }
                      />
                    </label>
                  </td>

                  <td style={tdStyle}>
                    <div style={reorderButtonGroupStyle}>
                      <button
                        style={{
                          ...secondaryButtonStyle,
                          ...(index === 0 ? disabledButtonStyle : {})
                        }}
                        disabled={index === 0}
                        onClick={() => moveStory(index, "up")}
                      >
                        ↑
                      </button>
                      <button
                        style={{
                          ...secondaryButtonStyle,
                          ...(index === stories.length - 1 ? disabledButtonStyle : {})
                        }}
                        disabled={index === stories.length - 1}
                        onClick={() => moveStory(index, "down")}
                      >
                        ↓
                      </button>
                    </div>
                  </td>

                  <td style={tdStyle}>
                    <button
                      style={deleteButtonStyle}
                      onClick={() =>
                        setStoryToDelete({
                          id: story.id,
                          title: story.title
                        })
                      }
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {stories.length === 0 && (
            <div style={emptyStateStyle}>
              No backlog items yet. Add your first product feature above.
            </div>
          )}
        </div>
      )}

      {storyToDelete && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <h3 style={modalTitleStyle}>Delete backlog item?</h3>
            <p style={modalTextStyle}>
              Are you sure you want to delete "{storyToDelete.title}"?
            </p>

            <div style={modalButtonRowStyle}>
              <button
                style={cancelButtonStyle}
                onClick={() => setStoryToDelete(null)}
              >
                Cancel
              </button>

              <button
                style={confirmDeleteButtonStyle}
                onClick={() => deleteStory(storyToDelete.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "#0f172a",
  color: "white",
  padding: "40px"
};

const titleStyle: CSSProperties = {
  textAlign: "center",
  marginBottom: "14px",
  fontSize: "68px",
  fontWeight: 800,
  lineHeight: 1.1
};

const subtitleStyle: CSSProperties = {
  textAlign: "center",
  marginBottom: "30px",
  color: "rgba(255,255,255,0.85)",
  maxWidth: "1050px",
  marginInline: "auto",
  fontSize: "28px",
  lineHeight: 1.5
};

const formCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "18px",
  padding: "26px",
  marginBottom: "28px"
};

const sectionHeadingStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "20px",
  fontSize: "40px",
  fontWeight: 700
};

const formRowStyle: CSSProperties = {
  display: "flex",
  gap: "16px",
  flexWrap: "wrap"
};

const inputStyle: CSSProperties = {
  flex: 1,
  minWidth: "260px",
  padding: "16px 18px",
  borderRadius: "12px",
  border: "none",
  outline: "none",
  fontSize: "24px",
  boxSizing: "border-box"
};

const smallInputStyle: CSSProperties = {
  width: "140px",
  padding: "16px 18px",
  borderRadius: "12px",
  border: "none",
  outline: "none",
  fontSize: "24px",
  boxSizing: "border-box"
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
  boxShadow: "0 0 0 2px rgba(255,255,255,0.08) inset"
};

const loadingTextStyle: CSSProperties = {
  fontSize: "24px",
  textAlign: "center"
};

const tableWrapperStyle: CSSProperties = {
  background: "white",
  borderRadius: "18px",
  padding: "24px",
  overflowX: "auto"
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  color: "#111",
  tableLayout: "fixed"
};

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "18px 14px",
  borderBottom: "2px solid #ddd",
  fontWeight: 700,
  fontSize: "28px"
};

const orderHeaderStyle: CSSProperties = {
  ...thStyle,
  width: "8%"
};

const titleHeaderStyle: CSSProperties = {
  ...thStyle,
  width: "26%"
};

const descriptionHeaderStyle: CSSProperties = {
  ...thStyle,
  width: "30%"
};

const pointsHeaderStyle: CSSProperties = {
  ...thStyle,
  width: "12%"
};

const doneHeaderStyle: CSSProperties = {
  ...thStyle,
  width: "8%"
};

const reorderHeaderStyle: CSSProperties = {
  ...thStyle,
  width: "9%"
};

const deleteHeaderStyle: CSSProperties = {
  ...thStyle,
  width: "12%"
};

const tdStyle: CSSProperties = {
  padding: "18px 14px",
  borderBottom: "1px solid #eee",
  verticalAlign: "middle",
  fontSize: "24px"
};

const cellInputStyle: CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "10px",
  border: "1px solid #ddd",
  fontSize: "24px",
  boxSizing: "border-box"
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
  lineHeight: 1.35
};

const pointsInputStyle: CSSProperties = {
  width: "110px",
  padding: "14px 16px",
  borderRadius: "10px",
  border: "1px solid #ddd",
  fontSize: "24px",
  boxSizing: "border-box"
};

const doneCheckboxWrapperStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "52px",
  height: "52px"
};

const checkboxStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  cursor: "pointer",
  accentColor: "#16a34a"
};

const reorderButtonGroupStyle: CSSProperties = {
  display: "flex",
  gap: "10px"
};

const secondaryButtonStyle: CSSProperties = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  background: "white",
  cursor: "pointer",
  fontSize: "22px",
  fontWeight: 700
};

const disabledButtonStyle: CSSProperties = {
  opacity: 0.45,
  cursor: "not-allowed"
};

const deleteButtonStyle: CSSProperties = {
  padding: "12px 18px",
  borderRadius: "10px",
  border: "none",
  background: "#dc2626",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "24px"
};

const emptyStateStyle: CSSProperties = {
  padding: "24px",
  textAlign: "center",
  color: "#666",
  fontSize: "24px"
};

const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000
};

const modalStyle: CSSProperties = {
  background: "white",
  borderRadius: "16px",
  padding: "26px",
  width: "90%",
  maxWidth: "460px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)"
};

const modalTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "12px",
  color: "#111",
  fontSize: "32px"
};

const modalTextStyle: CSSProperties = {
  color: "#444",
  marginBottom: "24px",
  fontSize: "22px",
  lineHeight: 1.5
};

const modalButtonRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px"
};

const cancelButtonStyle: CSSProperties = {
  padding: "10px 18px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  background: "white",
  color: "#111",
  cursor: "pointer",
  fontSize: "20px"
};

const confirmDeleteButtonStyle: CSSProperties = {
  padding: "10px 18px",
  borderRadius: "8px",
  border: "none",
  background: "#dc2626",
  color: "white",
  cursor: "pointer",
  fontSize: "20px"
};