/* import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, JSX } from "react";
import { useNavigate } from "react-router-dom";
import { listProjectEvents, type ProjectEvent } from "../api/projectEvents";

type DashboardCalendarPreviewProps = {
  projectId: string;
  role: string;
  title?: string;
  subtitle?: string;
};

type EventOccurrence = {
  instanceId: string;
  sourceEvent: ProjectEvent;
  occurrenceStart: string;
  occurrenceEnd: string;
};

type CalendarDay = {
  date: Date;
  isCurrentMonth: boolean;
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const styles: Record<string, CSSProperties> = {
  card: {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 24,
    padding: 22,
    boxShadow: "0 18px 44px rgba(0,0,0,0.22)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    cursor: "pointer",
    userSelect: "none",
    overflow: "hidden",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 16,
    marginBottom: 16,
    flexWrap: "wrap",
  },

  titleWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1.1,
  },

  subtitle: {
    margin: 0,
    fontSize: 14,
    color: "rgba(255,255,255,0.72)",
    lineHeight: 1.5,
  },

  monthLabel: {
    margin: 0,
    fontSize: 13,
    fontWeight: 700,
    color: "rgba(255,255,255,0.62)",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  weekHeader: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: 10,
    marginBottom: 10,
  },

  weekHeaderCell: {
    textAlign: "left",
    fontSize: 12,
    fontWeight: 700,
    color: "rgba(255,255,255,0.62)",
    padding: "0 4px",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: 10,
  },

  dayCell: {
    minHeight: 148,
    borderRadius: 18,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.05)",
    padding: 10,
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    overflow: "hidden",
    transition: "transform 0.15s ease, border-color 0.15s ease",
  },

  mutedDay: {
    opacity: 0.38,
  },

  today: {
    background: "rgba(37,99,235,0.18)",
    border: "1px solid rgba(96,165,250,0.5)",
    boxShadow: "inset 0 0 0 1px rgba(96,165,250,0.14)",
  },

  dayHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },

  dayNumber: {
    fontSize: 16,
    fontWeight: 800,
    lineHeight: 1,
  },

  todayPill: {
    fontSize: 10,
    fontWeight: 700,
    padding: "4px 7px",
    borderRadius: 999,
    background: "rgba(96,165,250,0.2)",
    border: "1px solid rgba(96,165,250,0.35)",
    color: "white",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    flexShrink: 0,
  },

  eventsList: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    minHeight: 0,
  },

  eventItem: {
    borderRadius: 10,
    background: "rgba(96,165,250,0.14)",
    border: "1px solid rgba(96,165,250,0.2)",
    padding: "7px 8px",
    overflow: "hidden",
  },

  eventName: {
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.25,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  eventTime: {
    marginTop: 3,
    fontSize: 11,
    color: "rgba(255,255,255,0.72)",
    lineHeight: 1.25,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  moreText: {
    marginTop: 2,
    fontSize: 11,
    color: "rgba(255,255,255,0.62)",
    fontWeight: 600,
  },

  emptyEventSpace: {
    marginTop: 4,
    fontSize: 11,
    color: "rgba(255,255,255,0.32)",
  },

  loading: {
    fontSize: 14,
    color: "rgba(255,255,255,0.72)",
    padding: "8px 2px",
  },
};

export default function DashboardCalendarPreview({
  projectId,
  role,
  title = "Project Calendar",
  subtitle = "Click anywhere on the calendar to open the full calendar page.",
}: DashboardCalendarPreviewProps): JSX.Element {
  const navigate = useNavigate();
  const [events, setEvents] = useState<ProjectEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth] = useState(() => startOfMonth(new Date()));

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const monthStart = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth(),
          1
        );

        const monthEnd = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + 1,
          1
        );

        const data = await listProjectEvents(projectId, monthStart, monthEnd, false);
        setEvents(data);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      load();
    }
  }, [projectId, currentMonth]);

  const calendarDays = useMemo(
    () => buildCalendarGrid(currentMonth),
    [currentMonth]
  );

  const visibleOccurrences = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return expandEventsForRange(events, start, end);
  }, [events, currentMonth]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventOccurrence[]>();

    for (const occurrence of visibleOccurrences) {
      const key = formatLocalDateKey(new Date(occurrence.occurrenceStart));
      const arr = map.get(key) ?? [];
      arr.push(occurrence);
      map.set(key, arr);
    }

    for (const [, arr] of map) {
      arr.sort(
        (a, b) =>
          new Date(a.occurrenceStart).getTime() -
          new Date(b.occurrenceStart).getTime()
      );
    }

    return map;
  }, [visibleOccurrences]);

  const openCalendar = () => {
    navigate(`/projects/${projectId}/${role}/calendar`);
  };

  return (
    <div
      style={styles.card}
      onClick={openCalendar}
      title="Open full calendar"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openCalendar();
        }
      }}
    >
      <div style={styles.header}>
        <div style={styles.titleWrap}>
          <h2 style={styles.title}>{title}</h2>
          <p style={styles.subtitle}>{subtitle}</p>
        </div>

        <p style={styles.monthLabel}>
          {currentMonth.toLocaleString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading calendar...</div>
      ) : (
        <>
          <div style={styles.weekHeader}>
            {weekdayLabels.map((label) => (
              <div key={label} style={styles.weekHeaderCell}>
                {label}
              </div>
            ))}
          </div>

          <div style={styles.grid}>
            {calendarDays.map((day) => {
              const key = formatLocalDateKey(day.date);
              const dayEvents = eventsByDate.get(key) ?? [];
              const today = isToday(day.date);

              return (
                <div
                  key={key}
                  style={{
                    ...styles.dayCell,
                    ...(day.isCurrentMonth ? null : styles.mutedDay),
                    ...(today ? styles.today : null),
                  }}
                >
                  <div style={styles.dayHeader}>
                    <div style={styles.dayNumber}>{day.date.getDate()}</div>
                    {today && <div style={styles.todayPill}>Today</div>}
                  </div>

                  <div style={styles.eventsList}>
                    {dayEvents.length === 0 ? (
                      <div style={styles.emptyEventSpace}>No events</div>
                    ) : (
                      <>
                        {dayEvents.slice(0, 3).map((occurrence) => (
                          <div key={occurrence.instanceId} style={styles.eventItem}>
                            <div style={styles.eventName}>
                              {occurrence.sourceEvent.title || "Untitled event"}
                            </div>
                            <div style={styles.eventTime}>
                              {formatEventTime(
                                occurrence.occurrenceStart,
                                occurrence.occurrenceEnd
                              )}
                            </div>
                          </div>
                        ))}

                        {dayEvents.length > 3 && (
                          <div style={styles.moreText}>
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function buildCalendarGrid(monthDate: Date): CalendarDay[] {
  const start = startOfWeek(startOfMonth(monthDate));
  const end = endOfWeek(endOfMonth(monthDate));
  const days: CalendarDay[] = [];

  const cursor = new Date(start);
  while (cursor <= end) {
    days.push({
      date: new Date(cursor),
      isCurrentMonth: cursor.getMonth() === monthDate.getMonth(),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function endOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  d.setDate(d.getDate() + (6 - d.getDay()));
  return d;
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function formatLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatEventTime(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const startText = startDate.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const endText = endDate.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${startText} - ${endText}`;
}

function expandEventsForRange(
  events: ProjectEvent[],
  rangeStart: Date,
  rangeEnd: Date
): EventOccurrence[] {
  const expanded: EventOccurrence[] = [];

  for (const event of events) {
    if (!event.rrule) {
      expanded.push({
        instanceId: `${event.id}-${event.start_at}`,
        sourceEvent: event,
        occurrenceStart: event.start_at,
        occurrenceEnd: event.end_at,
      });
      continue;
    }

    const parsed = parseRRule(event.rrule);
    const interval = Math.max(1, parsed.interval);
    const unit = parsed.unit;

    const baseStart = new Date(event.start_at);
    const baseEnd = new Date(event.end_at);
    const duration = baseEnd.getTime() - baseStart.getTime();

    let cursor = new Date(baseStart);
    let guard = 0;

    while (cursor <= rangeEnd && guard < 500) {
      const occurrenceEnd = new Date(cursor.getTime() + duration);

      if (occurrenceEnd >= rangeStart && cursor <= rangeEnd) {
        expanded.push({
          instanceId: `${event.id}-${cursor.toISOString()}`,
          sourceEvent: event,
          occurrenceStart: cursor.toISOString(),
          occurrenceEnd: occurrenceEnd.toISOString(),
        });
      }

      cursor = addInterval(cursor, interval, unit);
      guard += 1;
    }
  }

  return expanded;
}

function parseRRule(rrule: string | null): {
  interval: number;
  unit: "day" | "week" | "month" | "year";
} {
  if (!rrule) {
    return { interval: 1, unit: "week" };
  }

  const parts = rrule.split(";").reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split("=");
    if (key && value) {
      acc[key.toUpperCase()] = value.toUpperCase();
    }
    return acc;
  }, {});

  const freq = parts.FREQ;
  const interval = Math.max(1, Number(parts.INTERVAL || "1"));

  if (freq === "DAILY") return { interval, unit: "day" };
  if (freq === "WEEKLY") return { interval, unit: "week" };
  if (freq === "MONTHLY") return { interval, unit: "month" };
  if (freq === "YEARLY") return { interval, unit: "year" };

  return { interval: 1, unit: "week" };
}

function addInterval(
  date: Date,
  interval: number,
  unit: "day" | "week" | "month" | "year"
): Date {
  const next = new Date(date);

  if (unit === "day") {
    next.setDate(next.getDate() + interval);
    return next;
  }

  if (unit === "week") {
    next.setDate(next.getDate() + interval * 7);
    return next;
  }

  if (unit === "month") {
    next.setMonth(next.getMonth() + interval);
    return next;
  }

  next.setFullYear(next.getFullYear() + interval);
  return next;
} */ 


  import { useEffect, useMemo, useState } from "react";
  import type { CSSProperties, JSX } from "react";
  import { useNavigate } from "react-router-dom";
  import { DateTime } from "luxon";
  import {
    listProjectEvents,
    type ProjectEvent,
    type EventType,
  } from "../api/projectEvents";
  import { listProjects } from "../api/projects";
  import { useTheme } from "../pages/ThemeContext";
  
  type DashboardCalendarPreviewProps = {
    projectId: string;
    role: string;
    title?: string;
    subtitle?: string;
  };
  
  type EventOccurrence = {
    instanceId: string;
    sourceEvent: ProjectEvent;
    occurrenceStart: string;
    occurrenceEnd: string;
    projectName?: string;
  };
  
  type CalendarDay = {
    date: Date;
  };
  
  type ThemeStyles = {
    card: CSSProperties;
    title: CSSProperties;
    subtitle: CSSProperties;
    weekLabel: CSSProperties;
    timezoneLabel: CSSProperties;
    weekHeaderCell: CSSProperties;
    dayCell: CSSProperties;
    today: CSSProperties;
    dayName: CSSProperties;
    dayNumber: CSSProperties;
    eventCount: CSSProperties;
    todayPill: CSSProperties;
    emptyEventSpace: CSSProperties;
    loading: CSSProperties;
    scrollbarThumb: string;
    scrollbarThumbHover: string;
  };
  
  const localTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  
  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  const typeColors: Record<
    EventType,
    { bg: string; border: string; text: string; dot: string; label: string }
  > = {
    daily_scrum: {
      bg: "#dbeafe",
      border: "#93c5fd",
      text: "#1d4ed8",
      dot: "#3b82f6",
      label: "Daily Scrum",
    },
    sprint_planning: {
      bg: "#ede9fe",
      border: "#c4b5fd",
      text: "#5b21b6",
      dot: "#8b5cf6",
      label: "Sprint Planning",
    },
    review: {
      bg: "#d1fae5",
      border: "#6ee7b7",
      text: "#065f46",
      dot: "#10b981",
      label: "Review",
    },
    retrospective: {
      bg: "#fef3c7",
      border: "#fcd34d",
      text: "#92400e",
      dot: "#f59e0b",
      label: "Retrospective",
    },
    refinement: {
      bg: "#fce7f3",
      border: "#f9a8d4",
      text: "#9d174d",
      dot: "#ec4899",
      label: "Refinement",
    },
    deadline: {
      bg: "#fee2e2",
      border: "#fca5a5",
      text: "#991b1b",
      dot: "#ef4444",
      label: "Deadline",
    },
    milestone: {
      bg: "#dcfce7",
      border: "#86efac",
      text: "#14532d",
      dot: "#22c55e",
      label: "Milestone",
    },
    custom: {
      bg: "#f1f5f9",
      border: "#cbd5e1",
      text: "#475569",
      dot: "#94a3b8",
      label: "Custom",
    },
  };
  
  const baseStyles: Record<string, CSSProperties> = {
    card: {
      width: "100%",
      borderRadius: 24,
      padding: 22,
      cursor: "pointer",
      userSelect: "none",
      overflow: "hidden",
      boxSizing: "border-box",
      transition:
        "background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
    },
  
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: 16,
      marginBottom: 18,
      flexWrap: "wrap",
    },
  
    titleWrap: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
    },
  
    title: {
      margin: 0,
      fontSize: 24,
      fontWeight: 700,
      lineHeight: 1.1,
    },
  
    subtitle: {
      margin: 0,
      fontSize: 14,
      lineHeight: 1.5,
    },
  
    weekLabelWrap: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      gap: 4,
    },
  
    weekLabel: {
      margin: 0,
      fontSize: 13,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.7,
    },
  
    timezoneLabel: {
      margin: 0,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: 0.3,
    },
  
    weekHeader: {
      display: "grid",
      gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
      gap: 12,
      marginBottom: 10,
    },
  
    weekHeaderCell: {
      textAlign: "left",
      fontSize: 12,
      fontWeight: 700,
      padding: "0 8px",
      textTransform: "uppercase",
      letterSpacing: 0.7,
    },
  
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
      gap: 12,
      alignItems: "stretch",
    },
  
    dayCell: {
      minHeight: 250,
      maxHeight: 250,
      borderRadius: 20,
      padding: 12,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    },
  
    today: {},
  
    dayHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 8,
      marginBottom: 10,
      flexShrink: 0,
    },
  
    dayNameWrap: {
      display: "flex",
      flexDirection: "column",
      gap: 4,
    },
  
    dayName: {
      fontSize: 11,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.7,
      lineHeight: 1,
    },
  
    dayNumber: {
      fontSize: 22,
      fontWeight: 800,
      lineHeight: 1,
    },
  
    eventCount: {
      fontSize: 11,
      fontWeight: 700,
      borderRadius: 999,
      padding: "5px 8px",
      whiteSpace: "nowrap",
    },
  
    todayPill: {
      fontSize: 10,
      fontWeight: 700,
      padding: "4px 7px",
      borderRadius: 999,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      whiteSpace: "nowrap",
    },
  
    eventsList: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      minHeight: 0,
      flex: 1,
      overflowY: "auto",
      paddingRight: 4,
    },
  
    eventItem: {
      borderRadius: 12,
      padding: "8px 9px",
      overflow: "hidden",
      flexShrink: 0,
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    },
  
    eventTop: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginBottom: 4,
    },
  
    dot: {
      width: 8,
      height: 8,
      borderRadius: "50%",
      flexShrink: 0,
    },
  
    eventType: {
      fontSize: 10,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      opacity: 0.8,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
  
    eventName: {
      fontSize: 12,
      fontWeight: 700,
      lineHeight: 1.3,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
  
    projectName: {
      marginTop: 2,
      fontSize: 10,
      fontWeight: 700,
      opacity: 0.72,
      textTransform: "uppercase",
      letterSpacing: 0.45,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
  
    eventTime: {
      marginTop: 3,
      fontSize: 11,
      lineHeight: 1.3,
      opacity: 0.84,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
  
    emptyEventSpace: {
      marginTop: 2,
      fontSize: 12,
      padding: "10px 4px",
    },
  
    loading: {
      fontSize: 14,
      padding: "8px 2px",
    },
  };
  
  function getThemeStyles(isDark: boolean): ThemeStyles {
    if (isDark) {
      return {
        card: {
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 18px 44px rgba(0,0,0,0.22)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        },
        title: {
          color: "white",
        },
        subtitle: {
          color: "rgba(255,255,255,0.72)",
        },
        weekLabel: {
          color: "rgba(255,255,255,0.86)",
        },
        timezoneLabel: {
          color: "rgba(255,255,255,0.54)",
        },
        weekHeaderCell: {
          color: "rgba(255,255,255,0.56)",
        },
        dayCell: {
          background: "rgba(15,23,42,0.72)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
        },
        today: {
          background:
            "linear-gradient(180deg, rgba(30,64,175,0.38), rgba(15,23,42,0.82))",
          border: "1px solid rgba(96,165,250,0.55)",
          boxShadow:
            "inset 0 0 0 1px rgba(96,165,250,0.12), 0 8px 20px rgba(37,99,235,0.12)",
        },
        dayName: {
          color: "rgba(255,255,255,0.54)",
        },
        dayNumber: {
          color: "white",
        },
        eventCount: {
          color: "rgba(255,255,255,0.6)",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
        },
        todayPill: {
          background: "rgba(96,165,250,0.18)",
          border: "1px solid rgba(96,165,250,0.3)",
          color: "white",
        },
        emptyEventSpace: {
          color: "rgba(255,255,255,0.34)",
        },
        loading: {
          color: "rgba(255,255,255,0.72)",
        },
        scrollbarThumb: "rgba(255,255,255,0.18)",
        scrollbarThumbHover: "rgba(255,255,255,0.28)",
      };
    }
  
    return {
      card: {
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
      },
      title: {
        color: "#111827",
      },
      subtitle: {
        color: "#6b7280",
      },
      weekLabel: {
        color: "#374151",
      },
      timezoneLabel: {
        color: "#6b7280",
      },
      weekHeaderCell: {
        color: "#6b7280",
      },
      dayCell: {
        background: "#f8fafc",
        border: "1px solid #e5e7eb",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
      },
      today: {
        background: "linear-gradient(180deg, #eff6ff, #dbeafe)",
        border: "1px solid #93c5fd",
        boxShadow:
          "inset 0 0 0 1px rgba(147,197,253,0.3), 0 8px 20px rgba(59,130,246,0.08)",
      },
      dayName: {
        color: "#6b7280",
      },
      dayNumber: {
        color: "#111827",
      },
      eventCount: {
        color: "#4b5563",
        background: "#ffffff",
        border: "1px solid #e5e7eb",
      },
      todayPill: {
        background: "#dbeafe",
        border: "1px solid #93c5fd",
        color: "#1d4ed8",
      },
      emptyEventSpace: {
        color: "#9ca3af",
      },
      loading: {
        color: "#4b5563",
      },
      scrollbarThumb: "rgba(100,116,139,0.35)",
      scrollbarThumbHover: "rgba(100,116,139,0.55)",
    };
  }
  
  export default function DashboardCalendarPreview({
    projectId,
    role,
    title = "All Projects Calendar",
    subtitle = "This week across all projects. Scroll inside a day to view all events.",
  }: DashboardCalendarPreviewProps): JSX.Element {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isDark = theme === "dark";
  
    const [events, setEvents] = useState<EventOccurrence[]>([]);
    const [loading, setLoading] = useState(true);
  
    const currentWeekStart = useMemo(() => startOfWeek(new Date()), []);
    const currentWeekEnd = useMemo(() => endOfWeek(new Date()), []);
  
    const themeStyles = useMemo(() => getThemeStyles(isDark), [isDark]);
  
    useEffect(() => {
      const load = async () => {
        try {
          setLoading(true);
  
          const projects = await listProjects();
  
          const results = await Promise.all(
            projects.map(async (project) => {
              try {
                const data = await listProjectEvents(
                  project.id,
                  currentWeekStart,
                  addDays(currentWeekEnd, 1),
                  false
                );
  
                const expanded = expandEventsForRange(
                  data,
                  currentWeekStart,
                  currentWeekEnd
                );
  
                return expanded.map((occurrence) => ({
                  ...occurrence,
                  projectName: project.name,
                }));
              } catch {
                return [];
              }
            })
          );
  
          setEvents(results.flat());
        } catch {
          setEvents([]);
        } finally {
          setLoading(false);
        }
      };
  
      void load();
    }, [currentWeekStart, currentWeekEnd]);
  
    const weekDays = useMemo(
      () => buildWeekDays(currentWeekStart),
      [currentWeekStart]
    );
  
    const eventsByDate = useMemo(() => {
      const map = new Map<string, EventOccurrence[]>();
  
      for (const occurrence of events) {
        const zone = occurrence.sourceEvent.timezone || localTimezone;
        const key = formatUtcIsoToDateKeyInZone(occurrence.occurrenceStart, zone);
        const arr = map.get(key) ?? [];
        arr.push(occurrence);
        map.set(key, arr);
      }
  
      for (const [, arr] of map) {
        arr.sort(
          (a, b) =>
            DateTime.fromISO(a.occurrenceStart, { zone: "utc" }).toMillis() -
            DateTime.fromISO(b.occurrenceStart, { zone: "utc" }).toMillis()
        );
      }
  
      return map;
    }, [events]);
  
    const openCalendar = () => {
      navigate(`/projects/${projectId}/${role}/calendar`);
    };
  
    const timezoneShort = DateTime.now().setZone(localTimezone).toFormat("ZZZZ");
  
    return (
      <div
        style={{
          ...baseStyles.card,
          ...themeStyles.card,
        }}
        onClick={openCalendar}
        title="Open full calendar"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openCalendar();
          }
        }}
      >
        <style>{`
          .dashboard-week-scroll::-webkit-scrollbar {
            width: 6px;
          }
  
          .dashboard-week-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
  
          .dashboard-week-scroll::-webkit-scrollbar-thumb {
            background: ${themeStyles.scrollbarThumb};
            border-radius: 999px;
          }
  
          .dashboard-week-scroll::-webkit-scrollbar-thumb:hover {
            background: ${themeStyles.scrollbarThumbHover};
          }
        `}</style>
  
        <div style={baseStyles.header}>
          <div style={baseStyles.titleWrap}>
            <h2 style={{ ...baseStyles.title, ...themeStyles.title }}>{title}</h2>
            <p style={{ ...baseStyles.subtitle, ...themeStyles.subtitle }}>
              {subtitle}
            </p>
          </div>
  
          <div style={baseStyles.weekLabelWrap}>
            <p style={{ ...baseStyles.weekLabel, ...themeStyles.weekLabel }}>
              {formatWeekRange(currentWeekStart, currentWeekEnd)}
            </p>
            <p
              style={{
                ...baseStyles.timezoneLabel,
                ...themeStyles.timezoneLabel,
              }}
            >
              Displayed in {localTimezone} ({timezoneShort})
            </p>
          </div>
        </div>
  
        {loading ? (
          <div style={{ ...baseStyles.loading, ...themeStyles.loading }}>
            Loading week view...
          </div>
        ) : (
          <>
            <div style={baseStyles.weekHeader}>
              {weekdayLabels.map((label) => (
                <div
                  key={label}
                  style={{
                    ...baseStyles.weekHeaderCell,
                    ...themeStyles.weekHeaderCell,
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
  
            <div style={baseStyles.grid}>
              {weekDays.map((day) => {
                const key = formatLocalDateKey(day.date);
                const dayEvents = eventsByDate.get(key) ?? [];
                const today = isToday(day.date);
  
                return (
                  <div
                    key={key}
                    style={{
                      ...baseStyles.dayCell,
                      ...themeStyles.dayCell,
                      ...(today ? themeStyles.today : {}),
                    }}
                  >
                    <div style={baseStyles.dayHeader}>
                      <div style={baseStyles.dayNameWrap}>
                        <div style={{ ...baseStyles.dayName, ...themeStyles.dayName }}>
                          {day.date.toLocaleDateString(undefined, {
                            weekday: "short",
                          })}
                        </div>
                        <div
                          style={{
                            ...baseStyles.dayNumber,
                            ...themeStyles.dayNumber,
                          }}
                        >
                          {day.date.getDate()}
                        </div>
                      </div>
  
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 6,
                        }}
                      >
                        {today && (
                          <div
                            style={{
                              ...baseStyles.todayPill,
                              ...themeStyles.todayPill,
                            }}
                          >
                            Today
                          </div>
                        )}
                        <div
                          style={{
                            ...baseStyles.eventCount,
                            ...themeStyles.eventCount,
                          }}
                        >
                          {dayEvents.length} event{dayEvents.length === 1 ? "" : "s"}
                        </div>
                      </div>
                    </div>
  
                    <div
                      className="dashboard-week-scroll"
                      style={baseStyles.eventsList}
                      onClick={(e) => e.stopPropagation()}
                      onWheel={(e) => e.stopPropagation()}
                    >
                      {dayEvents.length === 0 ? (
                        <div
                          style={{
                            ...baseStyles.emptyEventSpace,
                            ...themeStyles.emptyEventSpace,
                          }}
                        >
                          No events
                        </div>
                      ) : (
                        dayEvents.map((occurrence) => {
                          const zone =
                            occurrence.sourceEvent.timezone || localTimezone;
                          const eventType = occurrence.sourceEvent.type || "custom";
                          const colors = typeColors[eventType] ?? typeColors.custom;
  
                          return (
                            <div
                              key={occurrence.instanceId}
                              style={{
                                ...baseStyles.eventItem,
                                background: colors.bg,
                                border: `1px solid ${colors.border}`,
                                color: colors.text,
                              }}
                            >
                              <div style={baseStyles.eventTop}>
                                <span
                                  style={{
                                    ...baseStyles.dot,
                                    background: colors.dot,
                                  }}
                                />
                                <span style={baseStyles.eventType}>{colors.label}</span>
                              </div>
  
                              <div style={baseStyles.eventName}>
                                {occurrence.sourceEvent.title || "Untitled event"}
                              </div>
  
                              {occurrence.projectName ? (
                                <div style={baseStyles.projectName}>
                                  {occurrence.projectName}
                                </div>
                              ) : null}
  
                              <div style={baseStyles.eventTime}>
                                {formatEventTime(
                                  occurrence.occurrenceStart,
                                  occurrence.occurrenceEnd,
                                  zone
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }
  
  function buildWeekDays(weekStart: Date): CalendarDay[] {
    return Array.from({ length: 7 }, (_, index) => ({
      date: addDays(weekStart, index),
    }));
  }
  
  function startOfWeek(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }
  
  function endOfWeek(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    d.setDate(d.getDate() + (6 - d.getDay()));
    return d;
  }
  
  function addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }
  
  function isToday(date: Date): boolean {
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }
  
  function formatLocalDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  
  function formatUtcIsoToDateKeyInZone(iso: string, zone: string): string {
    return DateTime.fromISO(iso, { zone: "utc" })
      .setZone(zone)
      .toFormat("yyyy-MM-dd");
  }
  
  function formatEventTime(start: string, end: string, zone: string): string {
    const startText = DateTime.fromISO(start, { zone: "utc" })
      .setZone(zone)
      .toFormat("h:mm a");
  
    const endText = DateTime.fromISO(end, { zone: "utc" })
      .setZone(zone)
      .toFormat("h:mm a");
  
    const zoneText = DateTime.fromISO(start, { zone: "utc" })
      .setZone(zone)
      .toFormat("ZZZZ");
  
    return `${startText} - ${endText} ${zoneText}`;
  }
  
  function formatWeekRange(start: Date, end: Date): string {
    const startLabel = start.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  
    const endLabel = end.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  
    return `${startLabel} - ${endLabel}`;
  }
  
  function expandEventsForRange(
    events: ProjectEvent[],
    rangeStart: Date,
    rangeEnd: Date
  ): EventOccurrence[] {
    const expanded: EventOccurrence[] = [];
  
    for (const event of events) {
      if (!event.rrule) {
        const start = new Date(event.start_at);
        const end = new Date(event.end_at);
  
        if (end >= rangeStart && start <= rangeEnd) {
          expanded.push({
            instanceId: `${event.id}-${event.start_at}`,
            sourceEvent: event,
            occurrenceStart: event.start_at,
            occurrenceEnd: event.end_at,
          });
        }
        continue;
      }
  
      const parsed = parseRRule(event.rrule);
      const interval = Math.max(1, parsed.interval);
      const unit = parsed.unit;
  
      const baseStart = new Date(event.start_at);
      const baseEnd = new Date(event.end_at);
      const duration = baseEnd.getTime() - baseStart.getTime();
  
      let cursor = new Date(baseStart);
      let guard = 0;
  
      while (cursor <= rangeEnd && guard < 500) {
        const occurrenceEnd = new Date(cursor.getTime() + duration);
  
        if (occurrenceEnd >= rangeStart && cursor <= rangeEnd) {
          expanded.push({
            instanceId: `${event.id}-${cursor.toISOString()}`,
            sourceEvent: event,
            occurrenceStart: cursor.toISOString(),
            occurrenceEnd: occurrenceEnd.toISOString(),
          });
        }
  
        cursor = addInterval(cursor, interval, unit);
        guard += 1;
      }
    }
  
    return expanded;
  }
  
  function parseRRule(rrule: string | null): {
    interval: number;
    unit: "day" | "week" | "month" | "year";
  } {
    if (!rrule) {
      return { interval: 1, unit: "week" };
    }
  
    const parts = rrule.split(";").reduce<Record<string, string>>((acc, part) => {
      const [key, value] = part.split("=");
      if (key && value) {
        acc[key.toUpperCase()] = value.toUpperCase();
      }
      return acc;
    }, {});
  
    const freq = parts.FREQ;
    const interval = Math.max(1, Number(parts.INTERVAL || "1"));
  
    if (freq === "DAILY") return { interval, unit: "day" };
    if (freq === "WEEKLY") return { interval, unit: "week" };
    if (freq === "MONTHLY") return { interval, unit: "month" };
    if (freq === "YEARLY") return { interval, unit: "year" };
  
    return { interval: 1, unit: "week" };
  }
  
  function addInterval(
    date: Date,
    interval: number,
    unit: "day" | "week" | "month" | "year"
  ): Date {
    const next = new Date(date);
  
    if (unit === "day") {
      next.setDate(next.getDate() + interval);
      return next;
    }
  
    if (unit === "week") {
      next.setDate(next.getDate() + interval * 7);
      return next;
    }
  
    if (unit === "month") {
      next.setMonth(next.getMonth() + interval);
      return next;
    }
  
    next.setFullYear(next.getFullYear() + interval);
    return next;
  }