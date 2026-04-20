import { useMemo, useState } from "react";
import type { CSSProperties, JSX } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SidebarLayout from "../components/SidebarLayout";
import { useTheme } from "./ThemeContext";
import { scrumQuestions } from "./ScrumQuestions";
import type { ScrumQuestion } from "./ScrumQuestions";
import ScrumQuestionCard from "../components/ScrumQuestionCard";
import ScrumExamResults from "../components/ScrumExamResults";

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

//const EXAM_LENGTH = 50;

function buildExamQuestions(length: number): ScrumQuestion[] {
  return shuffleArray(scrumQuestions)
    .slice(0, length)
    .map((q) => ({
      ...q,
      options: shuffleArray(q.options),
    }));
}

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

  const [questions, setQuestions] = useState<ScrumQuestion[]>([]);
  const [examLength, setExamLength] = useState<number | null>(null);
  const [showLengthModal, setShowLengthModal] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  const navigate = useNavigate();
  const { projectId, role } = useParams();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  function startExam(length: number): void {
    const generated = buildExamQuestions(length);

    setQuestions(generated);
    setExamLength(length);
    setAnswers({});
    setSubmitted(false);
    setScore(0);

    setShowLengthModal(false);
    setHasStarted(true);
  }

  function handleAnswerSelect(questionId: number, selectedOption: string): void {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: selectedOption,
    }));
  }

  function handleSubmit(): void {
    let totalCorrect = 0;

    questions.forEach((question) => {
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
    setQuestions([]);
    setExamLength(null);

    setShowLengthModal(true);
    setHasStarted(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const allAnswered = answeredCount === questions.length;
  const percentage = Math.round((score / questions.length) * 100);
  const progressPercentage = Math.round((answeredCount / questions.length) * 100);

  return (
    <>
      {showLengthModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#0b0f17",
              padding: "32px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.1)",
              maxWidth: 400,
              width: "100%",
              textAlign: "center",
            }}
          >
            <h2 style={{ marginBottom: 12 }}>Choose Exam Length</h2>
            <p style={{ marginBottom: 24, color: "#9ca3af" }}>
              Select a full exam or a shorter quiz.
            </p>

            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
              }}
            >
              <button
                onClick={() => startExam(15)}
                style={styles.primaryButton}
              >
                15 Questions
              </button>

              <button
                onClick={() => startExam(50)}
                style={styles.primaryButton}
              >
                50 Questions
              </button>
            </div>
          </div>
        </div>
      )}

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
              {examLength && (
                <p style={{ color: "#a78bfa", marginTop: 8 }}>
                  {examLength === 15 ? "15-Question Quick Quiz" : "50-Question Full Exam"}
                </p>
              )}
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

            {hasStarted && !submitted ? (
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
                      Progress: {answeredCount} / {questions.length} answered
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

                {questions.map((question, index) => (
                  <ScrumQuestionCard
                    key={question.id}
                    question={question}
                    questionNumber={index + 1}
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
            ) : hasStarted ? (
              <ScrumExamResults
                questions={questions}
                answers={answers}
                score={score}
                percentage={percentage}
                onRetake={handleRetake}
              />
            ) : null}
          </div>
        </div>
      </SidebarLayout>
    </>
  );
}

export default ScrumExamPage;