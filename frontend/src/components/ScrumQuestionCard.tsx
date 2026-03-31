import type { CSSProperties, JSX } from "react";
import type { ScrumQuestion } from "../pages/ScrumQuestions";
import { useTheme } from "../pages/ThemeContext";

type ScrumQuestionCardProps = {
  question: ScrumQuestion;
  selectedAnswer?: string;
  onSelectAnswer: (questionId: number, selectedOption: string) => void;
};

const styles: Record<string, CSSProperties> = {
  card: {
    borderRadius: 20,
    padding: "24px",
    marginBottom: "20px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  },

  title: {
    fontSize: "1.7rem",
    fontWeight: 700,
    marginBottom: "1.2rem",
  },

  optionLabel: {
    display: "block",
    marginBottom: "0.9rem",
    cursor: "pointer",
    fontSize: "1.05rem",
  },
};

function ScrumQuestionCard({
  question,
  selectedAnswer,
  onSelectAnswer,
}: ScrumQuestionCardProps): JSX.Element {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      style={{
        ...styles.card,
        background: isDark ? styles.card.background : "#ffffff",
        border: isDark
          ? styles.card.border
          : "1px solid rgba(17,24,39,0.08)",
      }}
    >
      <h3 style={styles.title}>
        {question.id}. {question.prompt}
      </h3>

      {question.options.map((option) => (
        <label
          key={option}
          style={{
            ...styles.optionLabel,
            color: isDark ? "#f9fafb" : "#111827",
          }}
        >
          <input
            type="radio"
            name={`question-${question.id}`}
            value={option}
            checked={selectedAnswer === option}
            onChange={() => onSelectAnswer(question.id, option)}
            style={{ marginRight: "0.6rem" }}
          />
          {option}
        </label>
      ))}
    </div>
  );
}

export default ScrumQuestionCard;