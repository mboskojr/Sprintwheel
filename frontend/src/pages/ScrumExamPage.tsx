import { useMemo, useState } from "react";
import type { CSSProperties, JSX } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SidebarLayout from "../components/SidebarLayout";
import { useTheme } from "./ThemeContext";
import { scrumQuestions } from "./ScrumQuestions";
import ScrumQuestionCard from "../components/ScrumQuestionCard";
import ScrumExamResults from "../components/ScrumExamResults";

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0b0f17 0%, #111827 100%)",
    padding: "16px 20px 48px",
    fontFamily: "Arial, sans-serif",
    color: "#f9fafb",
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },

  hero: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 24,
    padding: "32px",
    backdropFilter: "blur(10px)",
    marginBottom: 28,
  },

  eyebrow: {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "#a78bfa",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },

  title: {
    fontSize: "2.6rem",
    fontWeight: 700,
    margin: 0,
  },

  subtitle: {
    fontSize: "1rem",
    lineHeight: 1.7,
    color: "#d1d5db",
    marginTop: 14,
    maxWidth: "760px",
  },

  backButton: {
    marginBottom: "1rem",
    background: "rgba(124,58,237,0.15)",
    border: "1px solid rgba(124,58,237,0.3)",
    borderRadius: 999,
    padding: "8px 14px",
    color: "#c4b5fd",
    cursor: "pointer",
    fontWeight: 600,
  },

  progressCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
  },

  progressText: {
    fontSize: "1.05rem",
    fontWeight: 700,
    margin: 0,
  },

  progressTop: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  progressLabel: {
    fontSize: "1.05rem",
    fontWeight: 700,
    margin: 0,
  },

  progressSubtext: {
    color: "#9ca3af",
    fontSize: "0.95rem",
  },

  progressBarWrap: {
    width: "100%",
    height: 10,
    backgroundColor: "#1f2937",
    borderRadius: 999,
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    backgroundColor: "#7c3aed",
    borderRadius: 999,
    transition: "width 0.25s ease",
  },

  stickyProgressWrap: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    marginBottom: 20,
  },

  stickyProgressCard: {
    borderRadius: 16,
    padding: "16px 20px",
    backdropFilter: "blur(10px)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
  },

  primaryButton: {
    backgroundColor: "#7c3aed",
    color: "white",
    border: "none",
    borderRadius: 999,
    padding: "12px 20px",
    fontWeight: 700,
    cursor: "pointer",
  },

  disabledButton: {
    backgroundColor: "#4b5563",
    color: "#d1d5db",
    border: "none",
    borderRadius: 999,
    padding: "12px 20px",
    fontWeight: 700,
    cursor: "not-allowed",
    opacity: 0.7,
  },

  helperText: {
    marginTop: "0.75rem",
    color: "#9ca3af",
  },
};

function ScrumExamPage(): JSX.Element {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const navigate = useNavigate();
  const { projectId, role } = useParams();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  function handleAnswerSelect(questionId: number, selectedOption: string): void {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: selectedOption,
    }));
  }

  function handleSubmit(): void {
    let totalCorrect = 0;

    scrumQuestions.forEach((question) => {
      if (answers[question.id] === question.correctAnswer) {
        totalCorrect++;
      }
    });

    setScore(totalCorrect);
    setSubmitted(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleRetake(): void {
    setAnswers({});
    setSubmitted(false);
    setScore(0);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const allAnswered = answeredCount === scrumQuestions.length;
  const percentage = Math.round((score / scrumQuestions.length) * 100);
  const progressPercentage = Math.round((answeredCount / scrumQuestions.length) * 100);

  return (
    <SidebarLayout>
      <div
        style={{
          ...styles.page,
          background: isDark ? styles.page.background : "#f8fafc",
          color: isDark ? "#f9fafb" : "#111827",
        }}
      >
        <div style={styles.container}>
          <section
            style={{
              ...styles.hero,
              background: isDark ? styles.hero.background : "#ffffff",
              border: isDark
                ? styles.hero.border
                : "1px solid rgba(17,24,39,0.08)",
            }}
          >
            <button
              onClick={() => navigate(`/projects/${projectId}/${role}/education`)}
              style={styles.backButton}
            >
              ← Back to Learning
            </button>

            <p style={styles.eyebrow}>Scrum Assessment</p>
            <h1 style={styles.title}>Scrum Knowledge Exam</h1>
            <p
              style={{
                ...styles.subtitle,
                color: isDark ? "#d1d5db" : "#4b5563",
              }}
            >
              Test your understanding of Scrum roles, events, artifacts, and principles.
              Complete all questions before submitting to view your score and feedback.
            </p>
          </section>

          {!submitted ? (
            <>
              <div style={styles.stickyProgressWrap}>
                <section
                  style={{
                    ...styles.stickyProgressCard,
                    background: isDark ? "rgba(11,15,23,0.92)" : "rgba(255,255,255,0.96)",
                    border: isDark
                      ? "1px solid rgba(255,255,255,0.08)"
                      : "1px solid rgba(17,24,39,0.08)",
                  }}
                >
                <div style={styles.progressTop}>
                  <p style={styles.progressLabel}>
                    Progress: {answeredCount} / {scrumQuestions.length} answered
                  </p>
                  <span
                    style={{
                      ...styles.progressSubtext,
                      color: isDark ? "#9ca3af" : "#6b7280",
                    }}
                  >
                    {progressPercentage}% complete
                  </span>
                </div>

                <div style={styles.progressBarWrap}>
                  <div
                    style={{
                      ...styles.progressBar,
                      width: `${progressPercentage}%`,
                    }}
                  />
                </div>
              </section>
              </div>

              {scrumQuestions.map((question) => (
                <ScrumQuestionCard
                  key={question.id}
                  question={question}
                  selectedAnswer={answers[question.id]}
                  onSelectAnswer={handleAnswerSelect}
                />
              ))}

              <button
                onClick={handleSubmit}
                disabled={!allAnswered}
                style={allAnswered ? styles.primaryButton : styles.disabledButton}
              >
                Submit Exam
              </button>

              {!allAnswered && (
                <p style={styles.helperText}>
                  Please answer all questions before submitting.
                </p>
              )}
            </>
          ) : (
            <ScrumExamResults
              questions={scrumQuestions}
              answers={answers}
              score={score}
              percentage={percentage}
              onRetake={handleRetake}
            />
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}

export default ScrumExamPage;