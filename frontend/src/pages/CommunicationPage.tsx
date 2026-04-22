import { useMemo, useState } from "react";
import type { JSX, CSSProperties } from "react";
import SidebarLayout from "../components/SidebarLayout";
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useTheme } from "./ThemeContext";

type ColumnId = "impediments" | "retrospective" | "feedback";

interface CommCard {
  id: string;
  title: string;
  status: ColumnId;
  createdAt: number;
}

interface CommBoard {
  impediments: CommCard[];
  retrospective: CommCard[];
  feedback: CommCard[];
}

interface PendingDelete {
  cardId: string;
  status: ColumnId;
  title: string;
}

interface ColumnMeta {
  id: ColumnId;
  title: string;
  color: string;
  description: string;
  emptyLabel: string;
  placeholder: string;
}

const COLUMN_CONFIG: ColumnMeta[] = [
  {
    id: "impediments",
    title: "IMPEDIMENT TRACKER",
    color: "#fca5a5",
    description: "Blockers, risks, or dependencies slowing the sprint down.",
    emptyLabel: "No current impediments logged.",
    placeholder: "Add blocker, risk, or dependency...",
  },
  {
    id: "retrospective",
    title: "RETROSPECTIVE",
    color: "#fde68a",
    description: "What went well, what did not, and what should improve.",
    emptyLabel: "No retrospective notes yet.",
    placeholder: "Add lesson learned or sprint reflection...",
  },
  {
    id: "feedback",
    title: "FEEDBACK",
    color: "#86efac",
    description: "Team, product, or process feedback worth tracking.",
    emptyLabel: "No feedback added yet.",
    placeholder: "Add team or product feedback...",
  },
];

export default function CommunicationPage(): JSX.Element {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [board, setBoard] = useState<CommBoard>({
    impediments: [],
    retrospective: [],
    feedback: [],
  });

  const [inputs, setInputs] = useState<Record<ColumnId, string>>({
    impediments: "",
    retrospective: "",
    feedback: "",
  });

  const [cardToDelete, setCardToDelete] = useState<PendingDelete | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const totalCards = useMemo(
    () =>
      board.impediments.length +
      board.retrospective.length +
      board.feedback.length,
    [board]
  );

  function createCard(status: ColumnId) {
    const title = inputs[status].trim();
    if (!title) return;

    const newCard: CommCard = {
      id: crypto.randomUUID(),
      title,
      status,
      createdAt: Date.now(),
    };

    setBoard((prev) => ({
      ...prev,
      [status]: [newCard, ...prev[status]],
    }));

    setInputs((prev) => ({
      ...prev,
      [status]: "",
    }));
  }

  function deleteCard(cardId: string, status: ColumnId) {
    setBoard((prev) => ({
      ...prev,
      [status]: prev[status].filter((card) => card.id !== cardId),
    }));
  }

  function findCardLocation(cardId: string): { column: ColumnId; index: number } | null {
    for (const column of Object.keys(board) as ColumnId[]) {
      const index = board[column].findIndex((card) => card.id === cardId);
      if (index !== -1) {
        return { column, index };
      }
    }
    return null;
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const source = findCardLocation(activeId);
    if (!source) return;

    const targetColumn: ColumnId | null = (
      COLUMN_CONFIG.some((col) => col.id === overId)
        ? overId
        : findCardLocation(overId)?.column
    ) as ColumnId | null;

    if (!targetColumn) return;

    setBoard((prev) => {
      const nextBoard: CommBoard = {
        impediments: [...prev.impediments],
        retrospective: [...prev.retrospective],
        feedback: [...prev.feedback],
      };

      const sourceCards = [...nextBoard[source.column]];
      const sourceIndex = sourceCards.findIndex((card) => card.id === activeId);
      if (sourceIndex === -1) return prev;

      const [movedCard] = sourceCards.splice(sourceIndex, 1);
      const updatedCard: CommCard = { ...movedCard, status: targetColumn };

      if (source.column === targetColumn) {
        const overIndex = nextBoard[targetColumn].findIndex((card) => card.id === overId);

        if (overIndex === -1) {
          sourceCards.unshift(updatedCard);
        } else {
          sourceCards.splice(overIndex, 0, updatedCard);
        }

        nextBoard[source.column] = sourceCards;
        return nextBoard;
      }

      const targetCards = [...nextBoard[targetColumn]];
      const overIndex = targetCards.findIndex((card) => card.id === overId);

      if (overIndex === -1) {
        targetCards.unshift(updatedCard);
      } else {
        targetCards.splice(overIndex, 0, updatedCard);
      }

      nextBoard[source.column] = sourceCards;
      nextBoard[targetColumn] = targetCards;

      return nextBoard;
    });
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
        <div style={headerWrapStyle}>
          <h1 style={{ ...pageTitleStyle, color: isDark ? "white" : "#111827" }}>
            Communications
          </h1>

          <p style={{ ...pageSubStyle, color: isDark ? "#cbd5e1" : "#4b5563" }}>
            Keep sprint communication visible in one place through impediments,
            retrospective notes, and team feedback.
          </p>

          <p style={{ ...pageSubStyle, color: isDark ? "#cbd5e1" : "#4b5563" }}>
            Add cards quickly, drag them across sections, and remove items once they
            are resolved or no longer relevant.
          </p>

          <div
            style={{
              ...summaryRowStyle,
              color: isDark ? "#cbd5e1" : "#4b5563",
            }}
          >
            <span
              style={{
                ...summaryPillStyle,
                background: isDark ? "rgba(37,99,235,0.18)" : "#dbeafe",
                color: isDark ? "#93c5fd" : "#2563eb",
              }}
            >
              Total Notes: {totalCards}
            </span>
            <span
              style={{
                ...summaryPillStyle,
                background: isDark ? "rgba(37,99,235,0.18)" : "#dbeafe",
                color: isDark ? "#93c5fd" : "#2563eb",
              }}
            >
              Impediments: {board.impediments.length}
            </span>
            <span
              style={{
                ...summaryPillStyle,
                background: isDark ? "rgba(37,99,235,0.18)" : "#dbeafe",
                color: isDark ? "#93c5fd" : "#2563eb",
              }}
            >
              Retrospective: {board.retrospective.length}
            </span>
            <span
              style={{
                ...summaryPillStyle,
                background: isDark ? "rgba(37,99,235,0.18)" : "#dbeafe",
                color: isDark ? "#93c5fd" : "#2563eb",
              }}
            >
              Feedback: {board.feedback.length}
            </span>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <div style={boardStyle}>
            {COLUMN_CONFIG.map((column) => (
              <Column
                key={column.id}
                meta={column}
                tasks={board[column.id]}
                input={inputs[column.id]}
                setInput={(value: string) =>
                  setInputs((prev) => ({ ...prev, [column.id]: value }))
                }
                createTask={() => createCard(column.id)}
                setCardToDelete={setCardToDelete}
                isDark={isDark}
              />
            ))}
          </div>
        </DndContext>

        {cardToDelete && (
          <div style={modalOverlayStyle}>
            <div
              style={{
                ...modalStyle,
                background: isDark ? "#111827" : "white",
              }}
            >
              <h3
                style={{
                  ...modalTitleStyle,
                  color: isDark ? "white" : "#111",
                }}
              >
                Delete card?
              </h3>
              <p
                style={{
                  ...modalTextStyle,
                  color: isDark ? "#d1d5db" : "#444",
                }}
              >
                Are you sure you want to delete "{cardToDelete.title}"?
              </p>

              <div style={modalButtonRowStyle}>
                <button
                  style={cancelButtonStyle}
                  onClick={() => setCardToDelete(null)}
                >
                  Cancel
                </button>

                <button
                  style={confirmDeleteButtonStyle}
                  onClick={() => {
                    deleteCard(cardToDelete.cardId, cardToDelete.status);
                    setCardToDelete(null);
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

interface ColumnProps {
  meta: ColumnMeta;
  tasks: CommCard[];
  input: string;
  setInput: (value: string) => void;
  createTask: () => void;
  setCardToDelete: (card: PendingDelete | null) => void;
  isDark: boolean;
}

function Column({
  meta,
  tasks,
  input,
  setInput,
  createTask,
  setCardToDelete,
  isDark,
}: ColumnProps): JSX.Element {
  const { setNodeRef, isOver } = useDroppable({
    id: meta.id,
    data: { column: meta.id },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        ...columnStyle,
        background: meta.color,
        boxShadow: isDark
          ? "0 4px 10px rgba(0,0,0,0.25)"
          : "0 4px 10px rgba(0,0,0,0.08)",
        border: isDark
          ? "1px solid rgba(255,255,255,0.16)"
          : "1px solid rgba(17,24,39,0.08)",
        outline: isOver ? "3px solid rgba(17,24,39,0.18)" : "none",
        transform: isOver ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.18s ease",
      }}
    >
      <div style={columnHeaderWrapStyle}>
        <div>
          <h3 style={columnTitleStyle}>{meta.title}</h3>
          <p style={columnDescriptionStyle}>{meta.description}</p>
        </div>

        <div
          style={{
            ...countBadgeStyle,
            background: "rgba(255,255,255,0.6)", // slightly translucent
            color: "#111827", // always dark
          }}
        >
          {tasks.length}
        </div>
      </div>

      <div style={addTaskContainer}>
        <input
          className="comm-input"
          style={{
            ...inputStyle,
            border: isDark ? "1px solid rgba(255,255,255,0.16)" : "none",
            color: "#111827", // force dark text always
            background: isDark ? "rgba(255,255,255,0.12)" : "white",
          }}
          value={input}
          placeholder={meta.placeholder}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              createTask();
            }
          }}
        />

        <button
          style={{
            ...addButtonStyle,
            background: "#2563eb",
            color: "white",
          }}
          onClick={createTask}
          aria-label={`Add to ${meta.title}`}
        >
          +
        </button>
      </div>

      <div style={stackContainer}>
        {tasks.length === 0 ? (
          <div
            style={{
              ...emptyStateStyle,
              background: "rgba(255,255,255,0.28)",
              color: "#111827",
              border: "1px dashed rgba(17,24,39,0.18)",
            }}
          >
            <p
              style={{
                ...emptyStateTitleStyle,
                color: "#111827",
              }}
            >
              {meta.emptyLabel}
            </p>
            <p
              style={{
                ...emptyStateTextStyle,
                color: "#21252b",
              }}
            >
              Use this column to keep communication visible and easy to revisit.
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDelete={() =>
                setCardToDelete({
                  cardId: task.id,
                  status: meta.id,
                  title: task.title,
                })
              }
              isDark={isDark}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onDelete,
  isDark,
}: {
  task: CommCard;
  onDelete: () => void;
  isDark: boolean;
}): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style: CSSProperties = {
    ...cardStyle,
    background: isDark ? "rgba(255,255,255,0.12)" : "white",
    color: isDark ? "white" : "#111",
    boxShadow: isDragging
      ? "0 10px 24px rgba(0,0,0,0.22)"
      : isDark
      ? "0 6px 20px rgba(0,0,0,0.16)"
      : "0 4px 10px rgba(0,0,0,0.2)",
    opacity: isDragging ? 0.7 : 1,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
  };

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style}>
      <div style={cardContentStyle}>
        <span style={cardTitleStyle}>{task.title}</span>
      </div>

      <button
        style={{
          ...deleteButtonStyle,
          color: isDark ? "#cbd5e1" : "#999",
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        aria-label="Delete card"
      >
        ✕
      </button>
    </div>
  );
}

const pageStyle: CSSProperties = {
  color: "white",
  padding: 40,
  minHeight: "100vh",
};

const headerWrapStyle: CSSProperties = {
  marginBottom: 30,
};

const pageTitleStyle: CSSProperties = {
  marginBottom: 12,
  textAlign: "left",
  fontSize: 32,
  fontWeight: 700,
};

const pageSubStyle: CSSProperties = {
  textAlign: "left",
  marginTop: 0,
  marginBottom: 8,
  fontSize: 15,
  maxWidth: 760,
  lineHeight: 1.5,
};

const summaryRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 18,
};

const summaryPillStyle: CSSProperties = {
  padding: "8px 12px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.7)",
  color: "#111827",
  fontSize: 13,
  fontWeight: 600,
};

const boardStyle: CSSProperties = {
  display: "flex",
  gap: 24,
  marginTop: 10,
  flexWrap: "wrap",
  alignItems: "stretch",
};

const columnStyle: CSSProperties = {
  flex: "1 1 320px",
  padding: 20,
  borderRadius: 14,
  minHeight: 480,
};

const columnHeaderWrapStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 10,
};

const columnTitleStyle: CSSProperties = {
  color: "#111",
  fontWeight: 700,
  letterSpacing: "0.5px",
  marginTop: 0,
  marginBottom: 6,
  fontSize: 16,
};

const columnDescriptionStyle: CSSProperties = {
  margin: 0,
  color: "#374151",
  fontSize: 13,
  lineHeight: 1.4,
  maxWidth: 260,
};

const countBadgeStyle: CSSProperties = {
  minWidth: 32,
  height: 32,
  borderRadius: 999,
  background: "rgba(255,255,255,0.85)",
  color: "#111",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: 13,
  flexShrink: 0,
};

const stackContainer: CSSProperties = {
  marginTop: 18,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const emptyStateStyle: CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  borderRadius: 10,
  padding: 16,
  color: "#111827",
  border: "1px dashed rgba(17,24,39,0.18)",
};

const emptyStateTitleStyle: CSSProperties = {
  margin: 0,
  marginBottom: 6,
  fontWeight: 700,
  fontSize: 14,
};

const emptyStateTextStyle: CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: "#2d333b",
  lineHeight: 1.45,
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
  alignItems: "flex-start",
  gap: 12,
};

const cardContentStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const cardTitleStyle: CSSProperties = {
  display: "block",
  lineHeight: 1.45,
  wordBreak: "break-word",
};

const addTaskContainer: CSSProperties = {
  display: "flex",
  gap: 6,
  marginTop: 10,
};

const inputStyle: CSSProperties = {
  flex: 1,
  padding: 10,
  borderRadius: 6,
  border: "none",
  outline: "none",
  color: "#111",
  background: "white",
  fontSize: 14,
};

const addButtonStyle: CSSProperties = {
  width: 40,
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  background: "#111",
  color: "white",
  fontSize: 20,
  fontWeight: 700,
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
  justifyContent: "center",
  flexShrink: 0,
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
  borderRadius: 16,
  padding: 24,
  width: "90%",
  maxWidth: 400,
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
};

const modalTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 10,
  color: "#111",
};

const modalTextStyle: CSSProperties = {
  color: "#444",
  marginBottom: 20,
};

const modalButtonRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
};

const cancelButtonStyle: CSSProperties = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "1px solid #ccc",
  background: "white",
  color: "#111",
  cursor: "pointer",
};

const confirmDeleteButtonStyle: CSSProperties = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "none",
  background: "#dc2626",
  color: "white",
  cursor: "pointer",
};