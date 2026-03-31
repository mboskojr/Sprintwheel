import type { CSSProperties, JSX } from "react";
import type { ScrumQuestion } from "../pages/ScrumQuestions";
import { useTheme } from "../pages/ThemeContext";

type ScrumExamResultsProps = {
  questions: ScrumQuestion[];
  answers: Record<number, string>;
  score: number;
  percentage: number;
  onRetake: () => void;
};

const styles: Record<string, CSSProperties> = {
  summaryCard: {
    borderRadius: 20,
    padding: "24px",
    marginBottom: "24px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  },

  resultCard: {
    borderRadius: 20,
    padding: "24px",
    marginBottom: "18px",
  },

  button: {
    marginTop: "12px",
    backgroundColor: "#7c3aed",
    color: "white",
    border: "none",
    borderRadius: 999,
    padding: "12px 20px",
    fontWeight: 700,
    cursor: "pointer",
  },
};

function ScrumExamResults({
  questions,
  answers,
  score,
  percentage,
  onRetake,
}: ScrumExamResultsProps): JSX.Element {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div>
      <div
        style={{
          ...styles.summaryCard,
          background: isDark ? styles.summaryCard.background : "#ffffff",
          border: isDark
            ? styles.summaryCard.border
            : "1px solid rgba(17,24,39,0.08)",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Results</h2>
        <p style={{ fontSize: "1.1rem", marginBottom: 0 }}>
          You scored {score} out of {questions.length} ({percentage}%)
        </p>
      </div>

      {questions.map((question) => {
        const userAnswer = answers[question.id];
        const isCorrect = userAnswer === question.correctAnswer;

        const borderColor = isCorrect ? "#22c55e" : "#ef4444";
        const backgroundColor = isDark
          ? isCorrect
            ? "rgba(34, 197, 94, 0.12)"
            : "rgba(239, 68, 68, 0.12)"
          : isCorrect
            ? "rgba(34, 197, 94, 0.08)"
            : "rgba(239, 68, 68, 0.08)";

        return (
          <div
            key={question.id}
            style={{
              ...styles.resultCard,
              border: `1px solid ${borderColor}`,
              backgroundColor,
            }}
          >
            <h3>
              {question.id}. {question.prompt}
            </h3>

            <p>
              <strong>Your answer:</strong> {userAnswer || "No answer selected"}
            </p>

            <p>
              <strong>Correct answer:</strong> {question.correctAnswer}
            </p>

            <p>
              <strong>Result:</strong>{" "}
              <span style={{ color: borderColor, fontWeight: 700 }}>
                {isCorrect ? "Correct" : "Incorrect"}
              </span>
            </p>

            {question.explanation && (
              <p>
                <strong>Explanation:</strong> {question.explanation}
              </p>
            )}
          </div>
        );
      })}

      <button onClick={onRetake} style={styles.button}>
        Retake Exam
      </button>
    </div>
  );
}

export default ScrumExamResults;