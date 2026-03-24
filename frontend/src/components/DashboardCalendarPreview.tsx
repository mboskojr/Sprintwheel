import { useEffect, useMemo, useState } from "react";
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
}