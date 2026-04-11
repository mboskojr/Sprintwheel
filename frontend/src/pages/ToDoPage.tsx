/* import type { CSSProperties, JSX} from "react";

export default function ToDoPage(): JSX.Element {
    return (
        <div style={{ color: "white", padding: 40 }}>
            <h1>To-Do/Planning</h1>
            <p>This is the To-Do / Planning page.</p>
            <p> This is where the Task Board, Calendar, & Product Backlog will live</p>
            <p> Calendar Feature (Sprint #4)</p>
            <img src="/calendar-placeholder.png" alt="Calendar showing sprint schedule and important dates" style={{ maxWidth: "100%", height: "auto", marginTop: 20 }} />
            <p>Task Board</p>
            <img src="/task-board-placeholder.png" alt="Task Board showing tasks in different columns based on their status" style={{ maxWidth: "100%", height: "auto", marginTop: 20 }} />
            <p> Product Backlog</p>
            <img src="/product_backlog_framework.jpeg" alt="Product Backlog showing list of user stories and tasks" style={{ maxWidth: "100%", height: "auto", marginTop: 20 }} />

        </div>
    );
}*/ 

/* import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { JSX, CSSProperties } from "react";

import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent
} from "@dnd-kit/core";

interface Task {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
}

interface Board {
  todo: Task[];
  in_progress: Task[];
  done: Task[];
}

interface PendingDelete {
  taskId: string;
  status: keyof Board;
  title: string;
}

export default function ToDoPage(): JSX.Element {
  const { projectId } = useParams();

  const [board, setBoard] = useState<Board>({
    todo: [],
    in_progress: [],
    done: []
  });

  const [inputs, setInputs] = useState({
    todo: "",
    in_progress: "",
    done: ""
  });

  const [storyId, setStoryId] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<PendingDelete | null>(null);

  useEffect(() => {
    if (!projectId) return;

    fetch(`http://127.0.0.1:8000/projects/${projectId}/board`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setStoryId(data.story_id);

        setBoard({
          todo: data.todo,
          in_progress: data.in_progress,
          done: data.done
        });
      })
      .catch(err => console.error("Error fetching board:", err));
  }, [projectId]);

  function createTask(status: keyof Board) {
    const title = inputs[status].trim();
    if (!title || !projectId || !storyId) return;

    fetch("http://127.0.0.1:8000/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({
        title,
        description: "",
        story_id: storyId,
        status
      })
    })
      .then(res => res.json())
      .then(responseData => {
        const newTask: Task = {
          id: responseData.id,
          title: responseData.title || title,
          status
        };

        setBoard(prev => ({
          ...prev,
          [status]: [...prev[status], newTask]
        }));

        setInputs(prev => ({ ...prev, [status]: "" }));
      })
      .catch(err => console.error("Error creating task:", err));
  }

  function deleteTask(taskId: string, status: keyof Board) {
    setBoard(prev => ({
      ...prev,
      [status]: prev[status].filter(task => task.id !== taskId)
    }));

    fetch(`http://127.0.0.1:8000/tasks/${taskId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    }).catch(err => console.error("Error deleting task:", err));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.data.current?.column as keyof Board;

    if (!newStatus) return;

    let movedTask: Task | undefined;

    const newBoard: Board = {
      todo: [...board.todo],
      in_progress: [...board.in_progress],
      done: [...board.done]
    };

    for (const column of Object.keys(newBoard) as (keyof Board)[]) {
      const index = newBoard[column].findIndex(
        t => String(t.id) === String(taskId)
      );

      if (index !== -1) {
        movedTask = newBoard[column][index];
        newBoard[column].splice(index, 1);
        break;
      }
    }

    if (!movedTask) return;

    movedTask = { ...movedTask, status: newStatus };
    newBoard[newStatus].push(movedTask);

    setBoard(newBoard);

    fetch(`http://127.0.0.1:8000/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({
        status: newStatus
      })
    }).then(async res => {
      if (!res.ok) {
        console.error("PATCH error:", await res.text());
      }
    });
  }

  return (
    <div style={pageStyle}>
      <h1 style={{ marginBottom: 30, textAlign: "center" }}>Task Board</h1>

      <DndContext onDragEnd={handleDragEnd}>
        <div style={boardStyle}>
          <Column
            id="todo"
            title="TO DO"
            tasks={board.todo}
            color="#fca5a5"
            input={inputs.todo}
            setInput={(v: string) =>
              setInputs(prev => ({ ...prev, todo: v }))
            }
            createTask={() => createTask("todo")}
            setTaskToDelete={setTaskToDelete}
          />

          <Column
            id="in_progress"
            title="IN PROGRESS"
            tasks={board.in_progress}
            color="#fde68a"
            input={inputs.in_progress}
            setInput={(v: string) =>
              setInputs(prev => ({ ...prev, in_progress: v }))
            }
            createTask={() => createTask("in_progress")}
            setTaskToDelete={setTaskToDelete}
          />

          <Column
            id="done"
            title="DONE"
            tasks={board.done}
            color="#86efac"
            input={inputs.done}
            setInput={(v: string) =>
              setInputs(prev => ({ ...prev, done: v }))
            }
            createTask={() => createTask("done")}
            setTaskToDelete={setTaskToDelete}
          />
        </div>
      </DndContext>

      {taskToDelete && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <h3 style={modalTitleStyle}>Delete task?</h3>
            <p style={modalTextStyle}>
              Are you sure you want to delete "{taskToDelete.title}"?
            </p>

            <div style={modalButtonRowStyle}>
              <button
                style={cancelButtonStyle}
                onClick={() => setTaskToDelete(null)}
              >
                Cancel
              </button>

              <button
                style={confirmDeleteButtonStyle}
                onClick={() => {
                  deleteTask(taskToDelete.taskId, taskToDelete.status);
                  setTaskToDelete(null);
                }}
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

interface ColumnProps {
  id: keyof Board;
  title: string;
  tasks: Task[];
  color: string;
  input: string;
  setInput: (value: string) => void;
  createTask: () => void;
  setTaskToDelete: (task: PendingDelete | null) => void;
}

function Column({
  id,
  title,
  tasks,
  color,
  input,
  setInput,
  createTask,
  setTaskToDelete
}: ColumnProps) {
  const { setNodeRef } = useDroppable({
    id,
    data: { column: id }
  });

  return (
    <div ref={setNodeRef} style={{ ...columnStyle, background: color }}>
      <h3 style={columnTitleStyle}>{title}</h3>

      <div style={addTaskContainer}>
        <input
          style={inputStyle}
          value={input}
          placeholder="Add note..."
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              createTask();
            }
          }}
        />

        <button style={addButtonStyle} onClick={createTask}>
          +
        </button>
      </div>

      <div style={stackContainer}>
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onDelete={() =>
              setTaskToDelete({
                taskId: task.id,
                status: id,
                title: task.title
              })
            }
          />
        ))}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onDelete
}: {
  task: Task;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id
  });

  const style: CSSProperties = {
    ...cardStyle,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined
  };

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style}>
      <span>{task.title}</span>
      <button
        style={deleteButtonStyle}
        onPointerDown={e => e.stopPropagation()}
        onClick={e => {
          e.stopPropagation();
          onDelete();
        }}
      >
        ✕
      </button>
    </div>
  );
}

const pageStyle: CSSProperties = {
  color: "white",
  padding: 40,
  background: "#0f172a",
  minHeight: "100vh"
};

const boardStyle: CSSProperties = {
  display: "flex",
  gap: 30
};

const columnStyle: CSSProperties = {
  flex: 1,
  padding: 20,
  borderRadius: 14,
  minHeight: 450
};

const columnTitleStyle: CSSProperties = {
  color: "#111",
  fontWeight: 700,
  letterSpacing: "0.5px"
};

const stackContainer: CSSProperties = {
  marginTop: 20,
  display: "flex",
  flexDirection: "column",
  gap: 12
};

const cardStyle: CSSProperties = {
  background: "white",
  padding: 14,
  borderRadius: 8,
  color: "#111",
  fontWeight: 500,
  boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
  cursor: "grab",
  touchAction: "none",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
};

const addTaskContainer: CSSProperties = {
  display: "flex",
  gap: 6,
  marginTop: 10
};

const inputStyle: CSSProperties = {
  flex: 1,
  padding: 8,
  borderRadius: 6,
  border: "none",
  outline: "none",
  color: "#111",
  background: "white"
};

const addButtonStyle: CSSProperties = {
  padding: "6px 10px",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  background: "#111",
  color: "white"
};

const deleteButtonStyle: CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#999",
  cursor: "pointer",
  fontSize: "16px",
  padding: "4px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
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
  borderRadius: 16,
  padding: 24,
  width: "90%",
  maxWidth: 400,
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)"
};

const modalTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 10,
  color: "#111"
};

const modalTextStyle: CSSProperties = {
  color: "#444",
  marginBottom: 20
};

const modalButtonRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 12
};

const cancelButtonStyle: CSSProperties = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "1px solid #ccc",
  background: "white",
  color: "#111",
  cursor: "pointer"
};

const confirmDeleteButtonStyle: CSSProperties = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "none",
  background: "#dc2626",
  color: "white",
  cursor: "pointer"
}; */
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import type { JSX, CSSProperties } from "react";
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import SidebarLayout from "../components/SidebarLayout";
import { useTheme } from "./ThemeContext";

interface Task {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  assignee_id: string | null;
  position?: number | null;
}

interface Member {
  user_id: string;
  name: string;
  email: string;
  role: string;
}

interface Board {
  todo: Task[];
  in_progress: Task[];
  done: Task[];
}

interface PendingDelete {
  taskId: string;
  status: keyof Board;
  title: string;
}

const API = "http://127.0.0.1:8000";

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

function cloneBoard(board: Board): Board {
  return {
    todo: [...board.todo],
    in_progress: [...board.in_progress],
    done: [...board.done],
  };
}

function findTaskColumn(board: Board, taskId: string): keyof Board | null {
  for (const col of Object.keys(board) as (keyof Board)[]) {
    if (board[col].some((task) => String(task.id) === String(taskId))) {
      return col;
    }
  }
  return null;
}

function getTaskIndex(board: Board, column: keyof Board, taskId: string): number {
  return board[column].findIndex((task) => String(task.id) === String(taskId));
}

function normalizePositions(tasks: Task[]): Task[] {
  return tasks.map((task, index) => ({
    ...task,
    position: index,
  }));
}

export default function ToDoPage(): JSX.Element {
  const { projectId } = useParams();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [board, setBoard] = useState<Board>({ todo: [], in_progress: [], done: [] });
  const [inputs, setInputs] = useState({ todo: "", in_progress: "", done: "" });
  const [assignees, setAssignees] = useState<Record<string, string>>({
    todo: "",
    in_progress: "",
    done: "",
  });
  const [storyId, setStoryId] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<PendingDelete | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  useEffect(() => {
    if (!projectId) return;
    fetch(`${API}/projects/${projectId}/board`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        setStoryId(data.story_id);
        setBoard({
          todo: normalizePositions(
            [...(data.todo || [])].sort(
              (a: Task, b: Task) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER)
            )
          ),
          in_progress: normalizePositions(
            [...(data.in_progress || [])].sort(
              (a: Task, b: Task) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER)
            )
          ),
          done: normalizePositions(
            [...(data.done || [])].sort(
              (a: Task, b: Task) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER)
            )
          ),
        });
      })
      .catch((err) => console.error("Error fetching board:", err));
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    fetch(`${API}/projects/${projectId}/members`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch(() => setMembers([]));
  }, [projectId]);

  function persistTask(taskId: string, payload: Partial<Task>) {
    fetch(`${API}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    }).catch((err) => console.error("PATCH error:", err));
  }

  function persistColumnPositions(status: keyof Board, tasks: Task[]) {
    tasks.forEach((task, index) => {
      persistTask(task.id, { status, position: index });
    });
  }

  function createTask(status: keyof Board) {
    const title = inputs[status].trim();
    if (!title || !projectId || !storyId) return;
    const assignee_id = assignees[status] || null;
    const nextPosition = board[status].length;

    fetch(`${API}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        title,
        description: "",
        story_id: storyId,
        status,
        assignee_id,
        position: nextPosition,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        setBoard((prev) => {
          const updatedColumn = normalizePositions([
            ...prev[status],
            {
              id: data.id,
              title: data.title || title,
              status,
              assignee_id: data.assignee_id,
              position: data.position ?? nextPosition,
            },
          ]);
          return {
            ...prev,
            [status]: updatedColumn,
          };
        });
        setInputs((prev) => ({ ...prev, [status]: "" }));
        setAssignees((prev) => ({ ...prev, [status]: "" }));
      })
      .catch((err) => console.error("Error creating task:", err));
  }

  function deleteTask(taskId: string, status: keyof Board) {
    setBoard((prev) => {
      const updatedColumn = normalizePositions(prev[status].filter((t) => t.id !== taskId));
      persistColumnPositions(status, updatedColumn);
      return { ...prev, [status]: updatedColumn };
    });

    fetch(`${API}/tasks/${taskId}`, { method: "DELETE", headers: authHeaders() }).catch((err) =>
      console.error("Error deleting task:", err)
    );
  }

  function reassignTask(taskId: string, newAssigneeId: string | null) {
    setBoard((prev) => {
      const updated = { ...prev };
      for (const col of Object.keys(updated) as (keyof Board)[]) {
        updated[col] = updated[col].map((t) =>
          t.id === taskId ? { ...t, assignee_id: newAssigneeId } : t
        );
      }
      return updated;
    });

    persistTask(taskId, { assignee_id: newAssigneeId });
  }

  function handleDragStart(event: DragStartEvent) {
    const taskId = String(event.active.id);
    const column = findTaskColumn(board, taskId);
    if (!column) return;
    const task = board[column].find((t) => String(t.id) === taskId) || null;
    setActiveTask(task);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeColumn = findTaskColumn(board, activeId);
    if (!activeColumn) return;

    const overColumn =
      (["todo", "in_progress", "done"] as (keyof Board)[]).includes(overId as keyof Board)
        ? (overId as keyof Board)
        : findTaskColumn(board, overId);

    if (!overColumn) return;
    if (activeColumn === overColumn) return;

    setBoard((prev) => {
      const currentActiveColumn = findTaskColumn(prev, activeId);
      if (!currentActiveColumn) return prev;

      const targetColumn =
        (["todo", "in_progress", "done"] as (keyof Board)[]).includes(overId as keyof Board)
          ? (overId as keyof Board)
          : findTaskColumn(prev, overId);

      if (!targetColumn || currentActiveColumn === targetColumn) return prev;

      const sourceItems = [...prev[currentActiveColumn]];
      const targetItems = [...prev[targetColumn]];

      const activeIndex = sourceItems.findIndex((task) => String(task.id) === activeId);
      if (activeIndex === -1) return prev;

      const [movedTask] = sourceItems.splice(activeIndex, 1);

      const overIndex = targetItems.findIndex((task) => String(task.id) === overId);
      const insertIndex = overIndex >= 0 ? overIndex : targetItems.length;

      targetItems.splice(insertIndex, 0, { ...movedTask, status: targetColumn });

      return {
        ...prev,
        [currentActiveColumn]: normalizePositions(sourceItems),
        [targetColumn]: normalizePositions(targetItems),
      };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeColumn = findTaskColumn(board, activeId);
    if (!activeColumn) return;

    const overColumn =
      (["todo", "in_progress", "done"] as (keyof Board)[]).includes(overId as keyof Board)
        ? (overId as keyof Board)
        : findTaskColumn(board, overId);

    if (!overColumn) return;

    const nextBoard = cloneBoard(board);

    if (activeColumn === overColumn) {
      const oldIndex = getTaskIndex(nextBoard, activeColumn, activeId);
      const newIndex =
        (["todo", "in_progress", "done"] as (keyof Board)[]).includes(overId as keyof Board)
          ? nextBoard[overColumn].length - 1
          : getTaskIndex(nextBoard, overColumn, overId);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      nextBoard[activeColumn] = normalizePositions(
        arrayMove(nextBoard[activeColumn], oldIndex, newIndex)
      );

      setBoard(nextBoard);
      persistColumnPositions(activeColumn, nextBoard[activeColumn]);
      return;
    }

    const sourceItems = [...nextBoard[activeColumn]];
    const targetItems = [...nextBoard[overColumn]];

    const sourceIndex = sourceItems.findIndex((task) => String(task.id) === activeId);
    if (sourceIndex === -1) return;

    const [movedTask] = sourceItems.splice(sourceIndex, 1);

    const targetIndex =
      (["todo", "in_progress", "done"] as (keyof Board)[]).includes(overId as keyof Board)
        ? targetItems.length
        : Math.max(
            0,
            targetItems.findIndex((task) => String(task.id) === overId)
          );

    targetItems.splice(targetIndex, 0, { ...movedTask, status: overColumn });

    nextBoard[activeColumn] = normalizePositions(sourceItems);
    nextBoard[overColumn] = normalizePositions(targetItems);

    setBoard(nextBoard);

    persistTask(movedTask.id, {
      status: overColumn,
      position: targetIndex,
    });
    persistColumnPositions(activeColumn, nextBoard[activeColumn]);
    persistColumnPositions(overColumn, nextBoard[overColumn]);
  }

  function getMemberName(userId: string | null): string {
    if (!userId) return "";
    const m = members.find((m) => m.user_id === userId);
    return m ? m.name || m.email : "";
  }

  const activeAssigneeName = useMemo(
    () => (activeTask ? getMemberName(activeTask.assignee_id) : ""),
    [activeTask, members]
  );

  return (
    <SidebarLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap');

        .task-input::placeholder { color: #6b7280; }

        /* ── Ollie Todo ── */
        @keyframes ollie-float {
          0%,100%{transform:translateY(0px) rotate(-2deg)}
          50%{transform:translateY(-10px) rotate(2deg)}
        }
        @keyframes ollie-blink {
          0%,88%,100%{transform:scaleY(1)}
          94%{transform:scaleY(0.08)}
        }
        @keyframes bulb-glow {
          0%,100%{opacity:0.7;filter:drop-shadow(0 0 4px #fde68a)}
          50%{opacity:1;filter:drop-shadow(0 0 14px #fde68a) drop-shadow(0 0 28px #fbbf24)}
        }
        @keyframes bulb-ray {
          0%,100%{opacity:0.4;transform:scale(0.9)}
          50%{opacity:1;transform:scale(1.1)}
        }
        @keyframes t-wave-slow { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-7deg)} }
        @keyframes t-wave-med  { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(6deg)} }

        .ollie-todo-wrap  { animation:ollie-float 3.2s ease-in-out infinite; display:inline-block; }
        .todo-eye-l { animation:ollie-blink 4s ease-in-out infinite; transform-origin:28px 34px; }
        .todo-eye-r { animation:ollie-blink 4s ease-in-out infinite 0.18s; transform-origin:40px 34px; }
        .bulb-glow  { animation:bulb-glow 1.6s ease-in-out infinite; }
        .bulb-ray   { animation:bulb-ray  1.6s ease-in-out infinite; }

        .todo-t1 { animation:t-wave-slow 2.2s ease-in-out infinite;       transform-origin:18px 48px; }
        .todo-t2 { animation:t-wave-med  2.5s ease-in-out infinite 0.2s;  transform-origin:23px 52px; }
        .todo-t3 { animation:t-wave-slow 2.1s ease-in-out infinite 0.1s;  transform-origin:29px 54px; }
        .todo-t4 { animation:t-wave-med  2.1s ease-in-out infinite 0.3s;  transform-origin:35px 54px; }
        .todo-t5 { animation:t-wave-slow 2.5s ease-in-out infinite 0.15s; transform-origin:41px 52px; }
        .todo-t6 { animation:t-wave-med  2.2s ease-in-out infinite 0.05s; transform-origin:46px 48px; }

        @keyframes t-wave-books { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-5deg)} }
        .books-arm-l { animation:t-wave-books 2.8s ease-in-out infinite;       transform-origin:16px 36px; }
        .books-arm-r { animation:t-wave-books 2.8s ease-in-out infinite 0.2s;  transform-origin:52px 36px; }

        /* Ollie InProgress */
        @keyframes prog-float {
          0%,100%{transform:translateY(0px) rotate(-1.5deg)}
          50%{transform:translateY(-8px) rotate(1.5deg)}
        }
        @keyframes prog-blink {
          0%,88%,100%{transform:scaleY(1)}
          94%{transform:scaleY(0.08)}
        }
        @keyframes pencil-write {
          0%,100%{transform:rotate(-10deg) translate(0,0)}
          30%{transform:rotate(-10deg) translate(2px,1px)}
          60%{transform:rotate(-10deg) translate(-1px,2px)}
        }
        @keyframes check-pop {
          0%,70%,100%{transform:scale(1)}
          85%{transform:scale(1.3)}
        }

        .ollie-prog-wrap { animation:prog-float 2.8s ease-in-out infinite; display:inline-block; }
        .prog-eye-l { animation:prog-blink 5s ease-in-out infinite; transform-origin:28px 34px; }
        .prog-eye-r { animation:prog-blink 5s ease-in-out infinite 0.2s; transform-origin:40px 34px; }
        .pencil-anim { animation:pencil-write 1.5s ease-in-out infinite; transform-origin:60px 25px; }
        .check-anim  { animation:check-pop   2s ease-in-out infinite; transform-origin:58px 35px; }

        .prog-t1 { animation:t-wave-slow 2.2s ease-in-out infinite;       transform-origin:18px 48px; }
        .prog-t2 { animation:t-wave-med  2.5s ease-in-out infinite 0.2s;  transform-origin:23px 52px; }
        .prog-t3 { animation:t-wave-slow 2.1s ease-in-out infinite 0.1s;  transform-origin:29px 54px; }
        .prog-t4 { animation:t-wave-med  2.1s ease-in-out infinite 0.3s;  transform-origin:35px 54px; }
        .prog-t5 { animation:t-wave-slow 2.5s ease-in-out infinite 0.15s; transform-origin:41px 52px; }
        .prog-t6 { animation:t-wave-med  2.2s ease-in-out infinite 0.05s; transform-origin:46px 48px; }

        /* Ollie Done */
        @keyframes done-bounce {
          0%,100%{transform:translateY(0px) rotate(-2deg) scale(1)}
          25%{transform:translateY(-14px) rotate(3deg) scale(1.07)}
          75%{transform:translateY(-7px) rotate(-3deg) scale(1.04)}
        }
        @keyframes confetti-spin {
          0%{transform:rotate(0deg) translate(0,-20px) scale(0);opacity:0}
          30%{opacity:1;transform:rotate(120deg) translate(0,-20px) scale(1)}
          100%{transform:rotate(360deg) translate(0,-20px) scale(0);opacity:0}
        }
        @keyframes confetti-spin2 {
          0%{transform:rotate(60deg) translate(0,-26px) scale(0);opacity:0}
          40%{opacity:1;transform:rotate(210deg) translate(0,-26px) scale(1)}
          100%{transform:rotate(430deg) translate(0,-26px) scale(0);opacity:0}
        }
        @keyframes star-twinkle {
          0%,100%{opacity:0;transform:scale(0.5) rotate(0deg)}
          50%{opacity:1;transform:scale(1.2) rotate(20deg)}
        }
        @keyframes done-glow {
          0%,100%{filter:drop-shadow(0 0 6px rgba(34,197,94,0.4))}
          50%{filter:drop-shadow(0 0 18px rgba(34,197,94,0.85))}
        }

        .ollie-done-wrap { animation:done-bounce 1.9s ease-in-out infinite, done-glow 1.9s ease-in-out infinite; display:inline-block; }
        .done-eye-l { animation:ollie-blink 3.5s ease-in-out infinite; transform-origin:28px 34px; }
        .done-eye-r { animation:ollie-blink 3.5s ease-in-out infinite 0.15s; transform-origin:40px 34px; }
        .conf1 { animation:confetti-spin  1.8s ease-out infinite;       transform-origin:32px 24px; }
        .conf2 { animation:confetti-spin2 1.8s ease-out infinite 0.5s;  transform-origin:32px 24px; }
        .star1 { animation:star-twinkle 1.4s ease-in-out infinite;      transform-origin:12px 12px; }
        .star2 { animation:star-twinkle 1.4s ease-in-out infinite 0.7s; transform-origin:52px 10px; }

        .done-t1 { animation:t-wave-slow 1.9s ease-in-out infinite;       transform-origin:18px 48px; }
        .done-t2 { animation:t-wave-med  2.0s ease-in-out infinite 0.2s;  transform-origin:23px 52px; }
        .done-t3 { animation:t-wave-slow 1.8s ease-in-out infinite 0.1s;  transform-origin:29px 54px; }
        .done-t4 { animation:t-wave-med  1.8s ease-in-out infinite 0.3s;  transform-origin:35px 54px; }
        .done-t5 { animation:t-wave-slow 2.0s ease-in-out infinite 0.15s; transform-origin:41px 52px; }
        .done-t6 { animation:t-wave-med  1.9s ease-in-out infinite 0.05s; transform-origin:46px 48px; }
      `}</style>

      <div
        style={{
          ...pageStyle,
          background: isDark ? "#0b0f17" : "#f8fafc",
          color: isDark ? "white" : "#111827",
        }}
      >
        <h1 style={pageTitleStyle}>Task Board</h1>
        <p style={pageSubStyle}>Track, assign, and move tasks across your sprint board.</p>
        <p style={pageSubStyle}>
          Drag cards into designated columns to keep your team's work organized and moving forward.
        </p>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div style={boardStyle}>
            {(["todo", "in_progress", "done"] as (keyof Board)[]).map((col) => (
              <Column
                key={col}
                id={col}
                title={col === "todo" ? "TO DO" : col === "in_progress" ? "IN PROGRESS" : "DONE"}
                tasks={board[col]}
                color={col === "todo" ? "#fca5a5" : col === "in_progress" ? "#fde68a" : "#86efac"}
                input={inputs[col]}
                assigneeId={assignees[col]}
                members={members}
                isDark={isDark}
                setInput={(v) => setInputs((prev) => ({ ...prev, [col]: v }))}
                setAssigneeId={(v) => setAssignees((prev) => ({ ...prev, [col]: v }))}
                createTask={() => createTask(col)}
                setTaskToDelete={setTaskToDelete}
                getMemberName={getMemberName}
                onReassign={reassignTask}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div style={{ width: "100%" }}>
                <TaskCardView
                  task={activeTask}
                  assigneeName={activeAssigneeName}
                  dragging
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {taskToDelete && (
          <div style={modalOverlayStyle}>
            <div style={modalStyle}>
              <h3 style={modalTitleStyle}>Delete task?</h3>
              <p style={modalTextStyle}>
                Are you sure you want to delete "{taskToDelete.title}"?
              </p>
              <div style={modalButtonRowStyle}>
                <button style={cancelButtonStyle} onClick={() => setTaskToDelete(null)}>
                  Cancel
                </button>
                <button
                  style={confirmDeleteButtonStyle}
                  onClick={() => {
                    deleteTask(taskToDelete.taskId, taskToDelete.status);
                    setTaskToDelete(null);
                  }}
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

function OllieTodo() {
  return (
    <div className="ollie-todo-wrap">
      <svg width="110" height="110" viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g className="bulb-glow" style={{ transformOrigin: "40px 10px" }}>
          <g className="bulb-ray">
            <line x1="40" y1="2" x2="40" y2="-3" stroke="#fde68a" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="32" y1="4" x2="29" y2="0" stroke="#fde68a" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="48" y1="4" x2="51" y2="0" stroke="#fde68a" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="27" y1="10" x2="22" y2="9" stroke="#fde68a" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="53" y1="10" x2="58" y2="9" stroke="#fde68a" strokeWidth="1.5" strokeLinecap="round" />
          </g>
          <ellipse cx="40" cy="11" rx="6" ry="7" fill="#fef9c3" stroke="#fbbf24" strokeWidth="1.2" />
          <path d="M37 14 Q40 11 43 14" stroke="#f59e0b" strokeWidth="1" fill="none" strokeLinecap="round" />
          <rect x="37" y="17" width="6" height="3" rx="1" fill="#d97706" />
          <line x1="37" y1="18.5" x2="43" y2="18.5" stroke="#92400e" strokeWidth="0.8" />
          <ellipse cx="40" cy="10" rx="4" ry="4.5" fill="#fde68a" opacity="0.5" />
        </g>

        <g className="todo-t1"><path d="M18 48 Q14 54 16 60 Q18 66 15 70" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" /><circle cx="15" cy="70" r="2" fill="#534ab7" /></g>
        <g className="todo-t2"><path d="M23 52 Q21 58 23 64 Q25 68 22 72" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" /><circle cx="22" cy="72" r="2" fill="#534ab7" /></g>
        <g className="todo-t3"><path d="M29 54 Q29 60 31 66 Q32 70 30 73" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" /><circle cx="30" cy="73" r="2" fill="#534ab7" /></g>
        <g className="todo-t4"><path d="M35 54 Q37 60 35 66 Q34 70 36 73" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" /><circle cx="36" cy="73" r="2" fill="#534ab7" /></g>
        <g className="todo-t5"><path d="M41 52 Q43 58 41 64 Q39 68 42 72" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" /><circle cx="42" cy="72" r="2" fill="#534ab7" /></g>
        <g className="todo-t6"><path d="M46 48 Q50 54 48 60 Q46 66 49 70" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" /><circle cx="49" cy="70" r="2" fill="#534ab7" /></g>

        <g className="books-arm-l">
          <path d="M16 36 Q10 25 10 15" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <g transform="translate(10, 15) rotate(-10)">
            <rect x="-5" y="-6" width="10" height="12" rx="1" fill="#93c5fd" stroke="#2563eb" strokeWidth="1" />
            <line x1="-3" y1="-3" x2="3" y2="-3" stroke="#2563eb" strokeWidth="0.8" />
            <line x1="-3" y1="0" x2="3" y2="0" stroke="#2563eb" strokeWidth="0.8" />
          </g>
        </g>
        <g className="books-arm-r">
          <path d="M52 36 Q58 25 58 15" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <g transform="translate(58, 15) rotate(10)">
            <rect x="-5" y="-6" width="10" height="12" rx="1" fill="#93c5fd" stroke="#2563eb" strokeWidth="1" />
            <line x1="-3" y1="-3" x2="3" y2="-3" stroke="#2563eb" strokeWidth="0.8" />
            <line x1="-3" y1="0" x2="3" y2="0" stroke="#2563eb" strokeWidth="0.8" />
          </g>
        </g>

        <ellipse cx="34" cy="36" rx="18" ry="16" fill="#7f77dd" />
        <ellipse cx="28" cy="30" rx="6" ry="4" fill="#afa9ec" opacity="0.45" />

        <circle cx="28" cy="34" r="4" fill="white" className="todo-eye-l" />
        <circle cx="40" cy="34" r="4" fill="white" className="todo-eye-r" />
        <circle cx="29" cy="34" r="2" fill="#1a1a2e" className="todo-eye-l" />
        <circle cx="41" cy="34" r="2" fill="#1a1a2e" className="todo-eye-r" />
        <circle cx="30" cy="33" r="0.8" fill="white" className="todo-eye-l" />
        <circle cx="42" cy="33" r="0.8" fill="white" className="todo-eye-r" />

        <path d="M29 40 Q34 44 39 40" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <ellipse cx="24" cy="38" rx="3" ry="1.5" fill="#ed93b1" opacity="0.6" />
        <ellipse cx="44" cy="38" rx="3" ry="1.5" fill="#ed93b1" opacity="0.6" />
      </svg>
    </div>
  );
}

function OllieInProgress() {
  return (
    <div className="ollie-prog-wrap">
      <svg width="110" height="110" viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g style={{ transform: "rotate(-12deg)", transformOrigin: "16px 40px" }}>
          <path d="M20 40 Q10 32 8 22" stroke="#7f77dd" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <rect x="0" y="5" width="16" height="20" rx="2" fill="#fef3c7" stroke="#d97706" strokeWidth="1.2" />
          <rect x="5" y="3" width="6" height="5" rx="1.5" fill="#d97706" />
          <line x1="3" y1="13" x2="13" y2="13" stroke="#a16207" strokeWidth="0.9" />
          <line x1="3" y1="17" x2="13" y2="17" stroke="#a16207" strokeWidth="0.9" />
          <line x1="3" y1="21" x2="10" y2="21" stroke="#a16207" strokeWidth="0.9" />
          <rect x="3" y="11.5" width="2" height="2" rx="0.4" fill="none" stroke="#a16207" strokeWidth="0.7" />
          <rect x="3" y="15.5" width="2" height="2" rx="0.4" fill="none" stroke="#a16207" strokeWidth="0.7" />
          <path d="M3.3 12.5 L4 13.3 L5.5 11.8" stroke="#16a34a" strokeWidth="0.8" strokeLinecap="round" fill="none" />
        </g>

        <g className="pencil-anim">
          <path d="M50 40 Q58 35 60 25" stroke="#7f77dd" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <g transform="translate(60, 25) rotate(-15)">
            <polygon points="-2,0 2,0 0,6" fill="#92400e" />
            <polygon points="-3,-4 3,-4 0,3" fill="#fde047" />
            <rect x="-3" y="-20" width="6" height="16" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />
            <rect x="-3" y="-23" width="6" height="3" fill="#9ca3af" />
            <path d="M-3,-23 L-3,-25 Q0,-27 3,-25 L3,-23 Z" fill="#fca5a5" />
          </g>
        </g>

        <g className="prog-t1"><path d="M18 48 Q14 54 16 60 Q18 66 15 70" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" /><circle cx="15" cy="70" r="2" fill="#534ab7" /></g>
        <g className="prog-t2"><path d="M23 52 Q21 58 23 64 Q25 68 22 72" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" /><circle cx="22" cy="72" r="2" fill="#534ab7" /></g>
        <g className="prog-t3"><path d="M29 54 Q29 60 31 66 Q32 70 30 73" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" /><circle cx="30" cy="73" r="2" fill="#534ab7" /></g>
        <g className="prog-t4"><path d="M35 54 Q37 60 35 66 Q34 70 36 73" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" /><circle cx="36" cy="73" r="2" fill="#534ab7" /></g>
        <g className="prog-t5"><path d="M41 52 Q43 58 41 64 Q39 68 42 72" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" /><circle cx="42" cy="72" r="2" fill="#534ab7" /></g>
        <g className="prog-t6"><path d="M46 48 Q50 54 48 60 Q46 66 49 70" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" /><circle cx="49" cy="70" r="2" fill="#534ab7" /></g>

        <ellipse cx="34" cy="36" rx="18" ry="16" fill="#7f77dd" />
        <ellipse cx="28" cy="30" rx="6" ry="4" fill="#afa9ec" opacity="0.45" />

        <circle cx="28" cy="34" r="4" fill="white" className="prog-eye-l" />
        <circle cx="40" cy="34" r="4" fill="white" className="prog-eye-r" />
        <circle cx="29" cy="34" r="2" fill="#1a1a2e" className="prog-eye-l" />
        <circle cx="41" cy="34" r="2" fill="#1a1a2e" className="prog-eye-r" />
        <circle cx="30" cy="33" r="0.8" fill="white" className="prog-eye-l" />
        <circle cx="42" cy="33" r="0.8" fill="white" className="prog-eye-r" />

        <path d="M29 40 Q34 44 39 40" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <ellipse cx="24" cy="38" rx="3" ry="1.5" fill="#ed93b1" opacity="0.6" />
        <ellipse cx="44" cy="38" rx="3" ry="1.5" fill="#ed93b1" opacity="0.6" />
      </svg>
    </div>
  );
}

function OllieDone() {
  return (
    <div className="ollie-done-wrap">
      <svg width="110" height="110" viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g className="star1"><text x="10" y="14" fontSize="11" fill="#fde68a">★</text></g>
        <g className="star2"><text x="52" y="12" fontSize="9" fill="#fef9c3">✦</text></g>

        <g className="conf1" style={{ transformOrigin: "34px 30px" }}>
          <circle cx="34" cy="8" r="3" fill="#f97316" />
          <circle cx="14" cy="20" r="2" fill="#ec4899" />
          <circle cx="54" cy="20" r="2" fill="#06b6d4" />
        </g>
        <g className="conf2" style={{ transformOrigin: "34px 30px" }}>
          <rect x="32" y="4" width="4" height="4" rx="1" fill="#a78bfa" transform="rotate(30 34 6)" />
          <rect x="10" y="22" width="4" height="4" rx="1" fill="#34d399" transform="rotate(15 12 24)" />
          <rect x="54" y="24" width="4" height="4" rx="1" fill="#fbbf24" transform="rotate(45 56 26)" />
        </g>

        <polygon points="34,8 24,30 44,30" fill="#f97316" stroke="#ea580c" strokeWidth="1" />
        <polygon points="33,10 28,24 38,24" fill="#fde68a" opacity="0.6" />
        <circle cx="34" cy="8" r="2.5" fill="#fde68a" />
        <path d="M25 28 Q34 25 43 28" stroke="#ea580c" strokeWidth="1.5" fill="none" />

        <path d="M18 42 Q8 30 5 16" stroke="#7f77dd" strokeWidth="2.8" strokeLinecap="round" fill="none" />
        <text x="-2" y="18" fontSize="14">🎉</text>

        <path d="M50 42 Q62 30 65 16" stroke="#7f77dd" strokeWidth="2.8" strokeLinecap="round" fill="none" />
        <text x="60" y="18" fontSize="14">🎊</text>

        <g className="done-t1"><path d="M18 48 Q14 54 16 60 Q18 66 15 70" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" /><circle cx="15" cy="70" r="2" fill="#534ab7" /></g>
        <g className="done-t2"><path d="M23 52 Q21 58 23 64 Q25 68 22 72" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" /><circle cx="22" cy="72" r="2" fill="#534ab7" /></g>
        <g className="done-t3"><path d="M29 54 Q29 60 31 66 Q32 70 30 73" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" /><circle cx="30" cy="73" r="2" fill="#534ab7" /></g>
        <g className="done-t4"><path d="M35 54 Q37 60 35 66 Q34 70 36 73" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" /><circle cx="36" cy="73" r="2" fill="#534ab7" /></g>
        <g className="done-t5"><path d="M41 52 Q43 58 41 64 Q39 68 42 72" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" /><circle cx="42" cy="72" r="2" fill="#534ab7" /></g>
        <g className="done-t6"><path d="M46 48 Q50 54 48 60 Q46 66 49 70" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" /><circle cx="49" cy="70" r="2" fill="#534ab7" /></g>

        <ellipse cx="34" cy="36" rx="18" ry="16" fill="#7f77dd" />
        <ellipse cx="28" cy="30" rx="6" ry="4" fill="#afa9ec" opacity="0.45" />

        <circle cx="28" cy="34" r="4" fill="white" className="done-eye-l" />
        <circle cx="40" cy="34" r="4" fill="white" className="done-eye-r" />
        <circle cx="29" cy="34" r="2" fill="#1a1a2e" className="done-eye-l" />
        <circle cx="41" cy="34" r="2" fill="#1a1a2e" className="done-eye-r" />
        <circle cx="30" cy="33" r="0.8" fill="white" className="done-eye-l" />
        <circle cx="42" cy="33" r="0.8" fill="white" className="done-eye-r" />

        <path d="M29 40 Q34 44 39 40" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <ellipse cx="24" cy="38" rx="3" ry="1.5" fill="#ed93b1" opacity="0.6" />
        <ellipse cx="44" cy="38" rx="3" ry="1.5" fill="#ed93b1" opacity="0.6" />
      </svg>
    </div>
  );
}

interface ColumnProps {
  id: keyof Board;
  title: string;
  tasks: Task[];
  color: string;
  input: string;
  assigneeId: string;
  members: Member[];
  isDark: boolean;
  setInput: (v: string) => void;
  setAssigneeId: (v: string) => void;
  createTask: () => void;
  setTaskToDelete: (t: PendingDelete | null) => void;
  getMemberName: (id: string | null) => string;
  onReassign: (taskId: string, newAssigneeId: string | null) => void;
}

function Column({
  id,
  title,
  tasks,
  input,
  assigneeId,
  members,
  isDark,
  setInput,
  setAssigneeId,
  createTask,
  setTaskToDelete,
  getMemberName,
  onReassign,
}: ColumnProps) {
  const bgColor = id === "todo" ? "#ef4444" : id === "in_progress" ? "#eab308" : "#22c55e";

  return (
    <div
      style={{
        ...columnStyle,
        background: bgColor,
        border: "none",
        boxShadow: "0 8px 32px rgba(0,0,0,0.20)",
      }}
    >
      <div style={columnHeaderStyle}>
        {id === "todo" && <OllieTodo />}
        {id === "in_progress" && <OllieInProgress />}
        {id === "done" && <OllieDone />}
        <h3 style={columnTitleStyle}>{title}</h3>
      </div>

      {members.length > 0 && (
        <select
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          style={{
            ...assigneeSelectStyle,
            background: "#ffffff",
            color: "#111827",
            border: "1px solid rgba(0,0,0,0.15)",
          }}
        >
          <option value="">Assign to...</option>
          {members.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.name || m.email} — {m.role}
            </option>
          ))}
        </select>
      )}

      <div style={addTaskContainer}>
        <input
          className="task-input"
          style={{
            ...inputStyle,
            background: "#ffffff",
            color: "#111827",
            border: "1px solid rgba(0,0,0,0.15)",
          }}
          value={input}
          placeholder="Add task..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") createTask();
          }}
        />
        <button
          style={{
            ...addButtonStyle,
            background: "#ffffff",
            color: "#111827",
            border: "1px solid rgba(0,0,0,0.15)",
          }}
          onClick={createTask}
        >
          +
        </button>
      </div>

      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div style={stackContainer}>
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              assigneeName={getMemberName(task.assignee_id)}
              members={members}
              isDark={isDark}
              onDelete={() =>
                setTaskToDelete({
                  taskId: task.id,
                  status: id,
                  title: task.title,
                })
              }
              onReassign={onReassign}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableTaskCard({
  task,
  assigneeName,
  members,
  isDark,
  onDelete,
  onReassign,
}: {
  task: Task;
  assigneeName: string;
  members: Member[];
  isDark: boolean;
  onDelete: () => void;
  onReassign: (taskId: string, newAssigneeId: string | null) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
      }}
    >
      <TaskCardView
        task={task}
        assigneeName={assigneeName}
        members={members}
        isDark={isDark}
        onDelete={onDelete}
        onReassign={onReassign}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

function TaskCardView({
  task,
  assigneeName,
  members = [],
  onDelete,
  onReassign,
  dragHandleProps,
  dragging = false,
}: {
  task: Task;
  assigneeName: string;
  members?: Member[];
  isDark?: boolean;
  onDelete?: () => void;
  onReassign?: (taskId: string, newAssigneeId: string | null) => void;
  dragHandleProps?: Record<string, unknown>;
  dragging?: boolean;
}) {
  const [showReassign, setShowReassign] = useState(false);

  function handleReassign(e: React.ChangeEvent<HTMLSelectElement>) {
    if (!onReassign) return;
    const val = e.target.value;
    onReassign(task.id, val === "" ? null : val);
    setShowReassign(false);
  }

  return (
    <div
      {...dragHandleProps}
      style={{
        ...cardStyle,
        background: "rgba(255,255,255,0.92)",
        border: "none",
        color: "#111827",
        boxShadow: dragging
          ? "0 10px 24px rgba(0,0,0,0.18)"
          : "0 4px 12px rgba(0,0,0,0.12)",
        cursor: "grab",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={cardTitleStyle}>{task.title}</div>

        {!dragging && (
          <div onPointerDown={(e) => e.stopPropagation()} style={{ marginTop: 6 }}>
            {!showReassign ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReassign(true);
                }}
                style={{
                  background: assigneeName ? "rgba(127,119,221,0.10)" : "#f3f4f6",
                  border: "1px dashed " + (assigneeName ? "#6d28d9" : "#d1d5db"),
                  borderRadius: 6,
                  padding: "3px 8px",
                  fontSize: 12,
                  color: assigneeName ? "#6d28d9" : "#6b7280",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span>👤</span>
                {assigneeName || "Assign"}
                <span style={{ opacity: 0.5, fontSize: 10 }}>✏️</span>
              </button>
            ) : (
              <select
                autoFocus
                value={task.assignee_id ?? ""}
                onChange={handleReassign}
                onBlur={() => setShowReassign(false)}
                style={{
                  width: "100%",
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: "1px solid #c4b5fd",
                  fontSize: 12,
                  color: "#111827",
                  background: "#ffffff",
                  outline: "none",
                }}
              >
                <option value="">— Unassign —</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.name || m.email}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {!dragging && onDelete && (
        <button
          style={deleteButtonStyle}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

/* Styles */
const pageStyle: CSSProperties = {
  color: "white",
  padding: 40,
  minHeight: "100vh",
  background: "#0b0f17",
};

const pageTitleStyle: CSSProperties = {
  fontSize: 42,
  fontWeight: 900,
  letterSpacing: "-0.5px",
  marginBottom: 10,
  textAlign: "left",
};

const pageSubStyle: CSSProperties = {
  fontSize: 17,
  opacity: 0.85,
  marginTop: 4,
  lineHeight: 1.5,
};

const boardStyle: CSSProperties = {
  display: "flex",
  gap: 30,
  marginTop: 28,
  alignItems: "stretch",
};

const columnStyle: CSSProperties = {
  flex: 1,
  padding: "20px 20px 24px",
  borderRadius: 24,
  minHeight: 480,
};

const columnHeaderStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 2,
  marginBottom: 14,
};

const columnTitleStyle: CSSProperties = {
  color: "white",
  fontWeight: 900,
  fontSize: 22,
  letterSpacing: "1.5px",
  margin: 0,
  textTransform: "uppercase",
  textShadow: "0 2px 6px rgba(0,0,0,0.18)",
};

const stackContainer: CSSProperties = {
  marginTop: 12,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const cardStyle: CSSProperties = {
  padding: 16,
  borderRadius: 14,
  touchAction: "none",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 8,
};

const cardTitleStyle: CSSProperties = {
  fontWeight: 700,
  fontSize: 15,
  color: "#111827",
  lineHeight: 1.35,
};

const addTaskContainer: CSSProperties = {
  display: "flex",
  gap: 6,
  marginTop: 8,
};

const inputStyle: CSSProperties = {
  flex: 1,
  padding: "9px 12px",
  borderRadius: 10,
  outline: "none",
  fontSize: 14,
};

const addButtonStyle: CSSProperties = {
  padding: "6px 12px",
  borderRadius: 10,
  cursor: "pointer",
  fontSize: 20,
  fontWeight: 700,
};

const assigneeSelectStyle: CSSProperties = {
  width: "100%",
  marginTop: 4,
  padding: "8px 10px",
  borderRadius: 10,
  outline: "none",
  fontSize: 14,
  cursor: "pointer",
};

const deleteButtonStyle: CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#9ca3af",
  cursor: "pointer",
  fontSize: "16px",
  padding: "2px",
  flexShrink: 0,
};

const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.65)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  backdropFilter: "blur(2px)",
  WebkitBackdropFilter: "blur(2px)",
};

const modalStyle: CSSProperties = {
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 12,
  padding: 24,
  width: "90%",
  maxWidth: 400,
  boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.5)",
};

const modalTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 12,
  color: "white",
  fontSize: 20,
  fontWeight: 700,
};

const modalTextStyle: CSSProperties = {
  color: "#cbd5e1",
  marginBottom: 24,
  fontSize: 15,
};

const modalButtonRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: 12,
};

const cancelButtonStyle: CSSProperties = {
  padding: "8px 16px",
  borderRadius: "6px",
  border: "none",
  background: "#ffffff",
  color: "#111827",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
};

const confirmDeleteButtonStyle: CSSProperties = {
  padding: "8px 16px",
  borderRadius: "6px",
  border: "1px solid #b91c1c",
  background: "#dc2626",
  color: "white",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
};