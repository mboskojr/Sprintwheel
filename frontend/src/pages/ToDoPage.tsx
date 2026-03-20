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

import { useEffect, useState } from "react";
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
};