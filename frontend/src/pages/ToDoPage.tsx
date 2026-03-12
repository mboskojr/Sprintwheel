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
import type { JSX } from "react";

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
      });
  }, [projectId]);

  function createTask(status: keyof Board) {
    const title = inputs[status];
    if (!title || !projectId) return;

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
          status: status
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
      const index = newBoard[column].findIndex(t => String(t.id) === String(taskId));

      if (index !== -1) {
        movedTask = newBoard[column][index];
        newBoard[column].splice(index, 1);
      }
    }

    if (!movedTask) return;

    movedTask.status = newStatus;
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
      })
      .then(async res => {
        if (!res.ok) {
          console.error("PATCH error:", await res.text());
        }
    });
  }

  return (
    <div style={pageStyle}>
      <h1 style={{ marginBottom: 30 }}>SprintWheel Task Board</h1>

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
            deleteTask={deleteTask}
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
            deleteTask={deleteTask}
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
            deleteTask={deleteTask}
          />
        </div>
      </DndContext>
    </div>
  );
}

function Column({ id, title, tasks, color, input, setInput, createTask, deleteTask }: any) {
  const { setNodeRef } = useDroppable({
    id,
    data: { column: id }
  });

  return (
    <div ref={setNodeRef} style={{ ...columnStyle, background: color }}>
      <h3 style={{ color: "#111" }}>{title}</h3>

      <div style={addTaskContainer}>
        <input
          style={inputStyle}
          value={input}
          placeholder="Add note..."
          onChange={e => setInput(e.target.value)}
        />

        <button style={addButtonStyle} onClick={createTask}>
          +
        </button>
      </div>

      <div style={stackContainer}>
        {tasks.map((task: Task) => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onDelete={() => deleteTask(task.id, id)}
          />
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task, onDelete }: { task: Task, onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id
  });

  const style = {
    ...cardStyle,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined
  };

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style as React.CSSProperties}>
      <span>{task.title}</span>
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
    </div>
  );
}

const pageStyle = {
  color: "white",
  padding: 40,
  background: "#0f172a",
  minHeight: "100vh"
};

const boardStyle = {
  display: "flex",
  gap: 30
};

const columnStyle = {
  flex: 1,
  padding: 20,
  borderRadius: 14,
  minHeight: 450
};

const stackContainer = {
  marginTop: 20,
  display: "flex",
  flexDirection: "column",
  gap: 12
};

const cardStyle = {
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

const addTaskContainer = {
  display: "flex",
  gap: 6,
  marginTop: 10
};

const inputStyle = {
  flex: 1,
  padding: 8,
  borderRadius: 6,
  border: "none",
  outline: "none",
  color: "#111",
  background: "white"
};

const addButtonStyle = {
  padding: "6px 10px",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  background: "#111",
  color: "white"
};

const deleteButtonStyle = {
  background: "transparent",
  border: "none",
  color: "#999",
  cursor: "pointer",
  fontSize: "16px",
  padding: "4px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};