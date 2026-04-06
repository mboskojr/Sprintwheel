import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, JSX } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { DateTime } from "luxon";
import SidebarLayout from "../components/SidebarLayout";
import { useTheme } from "./ThemeContext";
import {
  listProjectEvents,
  createProjectEvent,
  updateProjectEvent,
  deleteProjectEvent,
  type ProjectEvent,
  type EventType,
} from "../api/projectEvents";

type RecurrencePreset =
  | "one_time"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "custom";

type RecurrenceUnit = "day" | "week" | "month" | "year";

type EventOccurrence = {
  instanceId: string;
  sourceEvent: ProjectEvent;
  occurrenceStart: string; // UTC ISO
  occurrenceEnd: string;   // UTC ISO
};

type EventFormState = {
  id?: string;
  title: string;
  type: EventType;
  start_at: string; // datetime-local wall clock
  end_at: string;   // datetime-local wall clock
  description: string;
  location: string;
  timezone: string;
  rrule: string;
  recurrencePreset: RecurrencePreset;
  recurrenceInterval: number;
  recurrenceUnit: RecurrenceUnit;
};

const localTimezone =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

const preferredTimezones = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

const allTimezones =
  typeof Intl !== "undefined" && "supportedValuesOf" in Intl
    ? (Intl.supportedValuesOf("timeZone") as string[])
    : preferredTimezones;

const timezones = [
  ...preferredTimezones,
  ...allTimezones.filter((tz) => !preferredTimezones.includes(tz)),
];

const emptyForm: EventFormState = {
  title: "",
  type: "custom",
  start_at: "",
  end_at: "",
  description: "",
  location: "",
  timezone: localTimezone,
  rrule: "",
  recurrencePreset: "one_time",
  recurrenceInterval: 1,
  recurrenceUnit: "week",
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const monthOptions = [
  { value: 0, label: "January" },
  { value: 1, label: "February" },
  { value: 2, label: "March" },
  { value: 3, label: "April" },
  { value: 4, label: "May" },
  { value: 5, label: "June" },
  { value: 6, label: "July" },
  { value: 7, label: "August" },
  { value: 8, label: "September" },
  { value: 9, label: "October" },
  { value: 10, label: "November" },
  { value: 11, label: "December" },
];

const yearOptions = Array.from({ length: 21 }, (_, i) => {
  const currentYear = new Date().getFullYear();
  return currentYear - 10 + i;
});

const recurrenceOptions: Array<{
  key: RecurrencePreset;
  label: string;
}> = [
  { key: "one_time", label: "One-time" },
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
  { key: "custom", label: "Custom" },
];

const typeColors: Record<EventType, string> = {
  daily_scrum: "#3b82f6",
  sprint_planning: "#8b5cf6",
  review: "#10b981",
  retrospective: "#f59e0b",
  refinement: "#ec4899",
  deadline: "#ef4444",
  milestone: "#22c55e",
  custom: "#94a3b8",
};

export default function CalendarPage(): JSX.Element {
  const navigate = useNavigate();
  const { projectId, role } = useParams();

  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [events, setEvents] = useState<ProjectEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [form, setForm] = useState<EventFormState>(emptyForm);

  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

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
      } catch (err: any) {
        setError(err?.message || "Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [projectId, currentMonth]);

  const calendarDays = useMemo(() => buildCalendarGrid(currentMonth), [currentMonth]);

  const visibleRange = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return { start, end };
  }, [currentMonth]);

  const visibleOccurrences = useMemo(() => {
    return expandEventsForRange(events, visibleRange.start, visibleRange.end);
  }, [events, visibleRange]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventOccurrence[]>();

    for (const occurrence of visibleOccurrences) {
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
  }, [visibleOccurrences]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    const key = formatLocalDateKey(selectedDay);
    return (eventsByDate.get(key) ?? []).slice().sort(
      (a, b) =>
        DateTime.fromISO(a.occurrenceStart, { zone: "utc" }).toMillis() -
        DateTime.fromISO(b.occurrenceStart, { zone: "utc" }).toMillis()
    );
  }, [selectedDay, eventsByDate]);

  function openCreateModal(date: Date) {
    const start = new Date(date);
    start.setHours(9, 0, 0, 0);

    const end = new Date(date);
    end.setHours(10, 0, 0, 0);

    setSelectedDate(date);
    setForm({
      ...emptyForm,
      start_at: toLocalInputValue(start),
      end_at: toLocalInputValue(end),
      timezone: localTimezone,
    });
    setModalOpen(true);
  }

  function openEditModal(event: ProjectEvent) {
    const recurrence = parseRRule(event.rrule ?? null);
    const zone = event.timezone || localTimezone;

    const zonedStart = DateTime.fromISO(event.start_at, { zone: "utc" }).setZone(zone);

    setSelectedDate(zonedStart.toJSDate());
    setForm({
      id: event.id,
      title: event.title,
      type: event.type,
      start_at: zonedStart.toFormat("yyyy-MM-dd'T'HH:mm"),
      end_at: DateTime.fromISO(event.end_at, { zone: "utc" })
        .setZone(zone)
        .toFormat("yyyy-MM-dd'T'HH:mm"),
      description: event.description ?? "",
      location: event.location ?? "",
      timezone: zone,
      rrule: event.rrule ?? "",
      recurrencePreset: recurrence.preset,
      recurrenceInterval: recurrence.interval,
      recurrenceUnit: recurrence.unit,
    });
    setModalOpen(true);
  }

  function openDayModal(date: Date) {
    setSelectedDay(new Date(date));
    setDayModalOpen(true);
  }

  function closeDayModal() {
    setDayModalOpen(false);
    setSelectedDay(null);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setForm(emptyForm);
    setSelectedDate(null);
  }

  function updateRecurrencePreset(preset: RecurrencePreset) {
    if (preset === "one_time") {
      setForm((prev) => ({
        ...prev,
        recurrencePreset: preset,
        recurrenceInterval: 1,
        recurrenceUnit: "week",
        rrule: "",
      }));
      return;
    }

    if (preset === "daily") {
      setForm((prev) => ({
        ...prev,
        recurrencePreset: preset,
        recurrenceInterval: 1,
        recurrenceUnit: "day",
      }));
      return;
    }

    if (preset === "weekly") {
      setForm((prev) => ({
        ...prev,
        recurrencePreset: preset,
        recurrenceInterval: 1,
        recurrenceUnit: "week",
      }));
      return;
    }

    if (preset === "monthly") {
      setForm((prev) => ({
        ...prev,
        recurrencePreset: preset,
        recurrenceInterval: 1,
        recurrenceUnit: "month",
      }));
      return;
    }

    if (preset === "yearly") {
      setForm((prev) => ({
        ...prev,
        recurrencePreset: preset,
        recurrenceInterval: 1,
        recurrenceUnit: "year",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      recurrencePreset: preset,
      recurrenceInterval: Math.max(1, prev.recurrenceInterval || 1),
    }));
  }

  async function handleSave() {
    if (!projectId) return;

    if (!form.title.trim()) {
      alert("Please enter an event title.");
      return;
    }

    if (!form.start_at || !form.end_at) {
      alert("Please enter both a start and end time.");
      return;
    }

    if (!form.timezone.trim()) {
      alert("Please select a timezone.");
      return;
    }

    const startLocal = DateTime.fromISO(form.start_at, { zone: form.timezone });
    const endLocal = DateTime.fromISO(form.end_at, { zone: form.timezone });

    if (!startLocal.isValid || !endLocal.isValid) {
      alert("Please enter valid start and end times.");
      return;
    }

    if (endLocal <= startLocal) {
      alert("End time must be after start time.");
      return;
    }

    if (form.recurrencePreset === "custom" && form.recurrenceInterval < 1) {
      alert("Custom repeat interval must be at least 1.");
      return;
    }

    try {
      setSaving(true);

      const rrule = buildRRuleFromForm(form);

      const startIso = startLocal.toUTC().toISO();
      const endIso = endLocal.toUTC().toISO();

      const payload = {
        title: form.title.trim(),
        type: form.type,
        start_at: startIso,
        end_at: endIso,
        description: form.description.trim() || null,
        location: form.location.trim() || null,
        timezone: form.timezone,
        rrule,
      };

      if (form.id) {
        const updated = await updateProjectEvent(projectId, form.id, payload);
        setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      } else {
        const created = await createProjectEvent(projectId, payload);
        setEvents((prev) => [...prev, created]);
      }

      closeModal();
    } catch (err: any) {
      alert(err?.message || "Failed to save event.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSeries() {
    if (!projectId || !form.id) return;

    const confirmed = window.confirm(
      isRepeatingForm(form)
        ? "Delete this repeating event series?"
        : "Delete this event?"
    );
    if (!confirmed) return;

    try {
      setSaving(true);
      await deleteProjectEvent(projectId, form.id);
      setEvents((prev) => prev.filter((e) => e.id !== form.id));
      closeModal();
    } catch (err: any) {
      alert(err?.message || "Failed to delete event.");
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteSingleOccurrence() {
    alert(
      "Deleting only one occurrence of a repeating event is not supported by the current backend yet. You can delete the full repeating series."
    );
  }

  return (
    <SidebarLayout>
      <div
        style={{
          ...styles.shell,
          background: isDark ? "#0b0f17" : "#f8fafc",
          color: isDark ? "white" : "#111827",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          style={styles.page}
        >
          <div style={styles.headerRow}>
            <div>
              <div style={styles.eyebrow}>Project Workspace</div>
              <h1 style={styles.title}>Calendar</h1>
              <div style={styles.subtitle}>
                View, create, edit, and manage project events.
              </div>
            </div>

            <div style={styles.headerActions}>
              <button
                style={styles.secondaryButton}
                onClick={() => {
                  let route = "developer-dashboard";

                  if (role === "product-owner") route = "product-owner-dashboard";
                  else if (role === "scrum-facilitator") route = "scrum-facilitator-dashboard";

                  navigate(`/projects/${projectId}/${role}/${route}`);
                }}
              >
                Back to Project
              </button>
              <button
                style={styles.primaryButton}
                onClick={() => openCreateModal(new Date())}
              >
                + New Event
              </button>
            </div>
          </div>

          <div style={styles.toolbar}>
            <div style={styles.monthControls}>
              <button
                style={styles.iconButton}
                onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
              >
                ←
              </button>

              <div style={styles.monthLabel}>
                {currentMonth.toLocaleString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </div>

              <button
                style={styles.iconButton}
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                →
              </button>
            </div>

            <div style={styles.calendarNavControls}>
              <button
                style={styles.secondaryButton}
                onClick={() => setCurrentMonth(startOfMonth(new Date()))}
              >
                Today
              </button>

              <select
                style={styles.navSelect}
                value={currentMonth.getMonth()}
                onChange={(e) =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      Number(e.target.value),
                      1
                    )
                  )
                }
              >
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>

              <select
                style={styles.navSelect}
                value={currentMonth.getFullYear()}
                onChange={(e) =>
                  setCurrentMonth(
                    new Date(
                      Number(e.target.value),
                      currentMonth.getMonth(),
                      1
                    )
                  )
                }
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div style={styles.card}>
              <div style={styles.infoText}>Loading calendar...</div>
            </div>
          ) : error ? (
            <div style={styles.card}>
              <div style={styles.errorText}>{error}</div>
            </div>
          ) : (
            <div style={styles.calendarCard}>
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
                  const isCurrentMonth = day.isCurrentMonth;
                  const isTodayValue = isToday(day.date);

                  return (
                    <div
                      key={key}
                      style={{
                        ...styles.dayCell,
                        ...(isCurrentMonth ? null : styles.dayCellMuted),
                      }}
                      onClick={() => openDayModal(day.date)}
                      onDoubleClick={() => openCreateModal(day.date)}
                    >
                      <div style={styles.dayTopRow}>
                        <button
                          style={{
                            ...styles.dayNumber,
                            ...(isTodayValue ? styles.todayBadge : null),
                            ...(isCurrentMonth ? null : styles.dayNumberMuted),
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openDayModal(day.date);
                          }}
                        >
                          {day.date.getDate()}
                        </button>
                      </div>

                      <div style={styles.eventsList}>
                        {dayEvents.map((occurrence) => {
                          const event = occurrence.sourceEvent;
                          const zone = event.timezone || localTimezone;
                          const zoneShort = shortTimezoneLabel(
                            occurrence.occurrenceStart,
                            zone
                          );

                          return (
                            <button
                              key={occurrence.instanceId}
                              style={{
                                ...styles.eventChip,
                                background: typeColors[event.type] + "22",
                                borderColor: typeColors[event.type],
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(event);
                              }}
                              title={`${event.title} • ${formatEventTimeRange(
                                occurrence.occurrenceStart,
                                occurrence.occurrenceEnd,
                                zone
                              )} • ${zone}`}
                            >
                              <span
                                style={{
                                  ...styles.eventDot,
                                  background: typeColors[event.type],
                                }}
                              />
                              <span style={styles.eventChipContent}>
                                <span style={styles.eventTitleText}>{event.title}</span>
                                <span style={styles.eventMetaText}>
                                  {formatEventDateTimeLine(
                                    occurrence.occurrenceStart,
                                    occurrence.occurrenceEnd,
                                    zone
                                  )}{" "}
                                  ({zoneShort})
                                </span>
                              </span>
                            </button>
                          );
                        })}

                        {dayEvents.length === 0 && <div style={styles.emptyDayText}>No events</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={styles.legendCard}>
            <div style={styles.legendTitle}>Event Types</div>
            <div style={styles.legendWrap}>
              {(Object.keys(typeColors) as EventType[]).map((type) => (
                <div key={type} style={styles.legendItem}>
                  <span
                    style={{
                      ...styles.legendDot,
                      background: typeColors[type],
                    }}
                  />
                  <span>{labelForType(type)}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {dayModalOpen && (
          <div style={styles.modalOverlay} onClick={closeDayModal}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              style={styles.dayModalCard}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <div>
                  <div style={styles.modalTitle}>Day Events</div>
                  <div style={styles.modalSubtitle}>
                    {selectedDay
                      ? selectedDay.toLocaleDateString(undefined, {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : ""}
                  </div>
                </div>

                <button style={styles.closeButton} onClick={closeDayModal}>
                  ✕
                </button>
              </div>

              <div style={styles.dayModalList}>
                {selectedDayEvents.length === 0 ? (
                  <div style={styles.dayModalEmpty}>No events</div>
                ) : (
                  selectedDayEvents.map((occurrence) => {
                    const event = occurrence.sourceEvent;
                    const zone = event.timezone || localTimezone;
                    const zoneShort = shortTimezoneLabel(
                      occurrence.occurrenceStart,
                      zone
                    );

                    return (
                      <button
                        key={occurrence.instanceId}
                        style={{
                          ...styles.dayModalEvent,
                          borderLeftColor: typeColors[event.type],
                        }}
                        onClick={() => openEditModal(event)}
                      >
                        <div style={styles.dayModalEventTitle}>{event.title}</div>
                        <div style={styles.dayModalEventMeta}>
                          {formatEventDateTimeLine(
                            occurrence.occurrenceStart,
                            occurrence.occurrenceEnd,
                            zone
                          )}{" "}
                          ({zoneShort})
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}

        {modalOpen && (
          <div style={styles.modalOverlay} onClick={closeModal}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              style={styles.modalCard}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <div>
                  <div style={styles.modalTitle}>
                    {form.id ? "Edit Event" : "Create Event"}
                  </div>
                  <div style={styles.modalSubtitle}>
                    {selectedDate
                      ? selectedDate.toLocaleDateString(undefined, {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Project event"}
                  </div>
                </div>

                <button style={styles.closeButton} onClick={closeModal}>
                  ✕
                </button>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.fieldFull}>
                  <label style={styles.label}>Title</label>
                  <input
                    style={styles.input}
                    value={form.title}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Enter event title"
                  />
                </div>

                <div>
                  <label style={styles.label}>Type</label>
                  <select
                    style={styles.input}
                    value={form.type}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        type: e.target.value as EventType,
                      }))
                    }
                  >
                    <option value="daily_scrum">Daily Scrum</option>
                    <option value="sprint_planning">Sprint Planning</option>
                    <option value="review">Review</option>
                    <option value="retrospective">Retrospective</option>
                    <option value="refinement">Refinement</option>
                    <option value="deadline">Deadline</option>
                    <option value="milestone">Milestone</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Timezone</label>
                  <select
                    style={styles.input}
                    value={form.timezone}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, timezone: e.target.value }))
                    }
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>
                        {timezoneOptionLabel(tz)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Start</label>
                  <input
                    style={styles.input}
                    type="datetime-local"
                    value={form.start_at}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, start_at: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label style={styles.label}>End</label>
                  <input
                    style={styles.input}
                    type="datetime-local"
                    value={form.end_at}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, end_at: e.target.value }))
                    }
                  />
                </div>

                <div style={styles.fieldFull}>
                  <label style={styles.label}>Repeats</label>
                  <div style={styles.repeatButtonRow}>
                    {recurrenceOptions.map((option) => {
                      const active = form.recurrencePreset === option.key;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          style={{
                            ...styles.repeatButton,
                            ...(active ? styles.repeatButtonActive : null),
                          }}
                          onClick={() => updateRecurrencePreset(option.key)}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {form.recurrencePreset === "custom" && (
                  <>
                    <div>
                      <label style={styles.label}>Repeat Every</label>
                      <input
                        style={styles.input}
                        type="number"
                        min={1}
                        value={form.recurrenceInterval}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            recurrenceInterval: Math.max(1, Number(e.target.value) || 1),
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label style={styles.label}>Unit</label>
                      <select
                        style={styles.input}
                        value={form.recurrenceUnit}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            recurrenceUnit: e.target.value as RecurrenceUnit,
                          }))
                        }
                      >
                        <option value="day">Days</option>
                        <option value="week">Weeks</option>
                        <option value="month">Months</option>
                        <option value="year">Years</option>
                      </select>
                    </div>
                  </>
                )}

                <div style={styles.fieldFull}>
                  <label style={styles.label}>Location</label>
                  <input
                    style={styles.input}
                    value={form.location}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, location: e.target.value }))
                    }
                    placeholder="Optional location"
                  />
                </div>

                <div style={styles.fieldFull}>
                  <label style={styles.label}>Description</label>
                  <textarea
                    style={styles.textarea}
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Add event details"
                  />
                </div>
              </div>

              <div style={styles.modalActions}>
                {form.id && !isRepeatingForm(form) && (
                  <button
                    style={styles.deleteButton}
                    onClick={handleDeleteSeries}
                    disabled={saving}
                  >
                    Delete Event
                  </button>
                )}

                {form.id && isRepeatingForm(form) && (
                  <div style={styles.deleteChoiceWrap}>
                    <button
                      style={styles.deleteChoiceButton}
                      onClick={handleDeleteSingleOccurrence}
                      disabled={saving}
                    >
                      Delete Just This Event
                    </button>
                    <button
                      style={styles.deleteButton}
                      onClick={handleDeleteSeries}
                      disabled={saving}
                    >
                      Delete Repeat Events
                    </button>
                  </div>
                )}

                <div style={styles.modalActionsRight}>
                  <button
                    style={styles.secondaryButton}
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    style={styles.primaryButton}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : form.id ? "Update Event" : "Create Event"}
                  </button>
                </div>
              </div>

              <div style={styles.previewCard}>
                <div style={styles.previewTitle}>Event Preview</div>
                <div style={styles.previewRow}>
                  <span style={styles.previewLabel}>Time:</span>
                  <span>
                    {form.start_at && form.end_at
                      ? formatFormTimeRange(form.start_at, form.end_at, form.timezone)
                      : "—"}
                  </span>
                </div>
                <div style={styles.previewRow}>
                  <span style={styles.previewLabel}>Timezone:</span>
                  <span>{form.timezone ? timezoneOptionLabel(form.timezone) : "—"}</span>
                </div>
                <div style={styles.previewRow}>
                  <span style={styles.previewLabel}>Type:</span>
                  <span>{labelForType(form.type)}</span>
                </div>
                <div style={styles.previewRow}>
                  <span style={styles.previewLabel}>Repeats:</span>
                  <span>{describeRecurrence(form)}</span>
                </div>
                <div style={styles.previewRow}>
                  <span style={styles.previewLabel}>Location:</span>
                  <span>{form.location || "—"}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

function buildCalendarGrid(monthDate: Date) {
  const start = startOfWeek(startOfMonth(monthDate));
  const end = endOfWeek(endOfMonth(monthDate));
  const days: { date: Date; isCurrentMonth: boolean }[] = [];

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

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function endOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  d.setDate(d.getDate() + (6 - d.getDay()));
  return d;
}

function addMonths(date: Date, count: number) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function isToday(date: Date) {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function formatLocalDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatUtcIsoToDateKeyInZone(dateInput: string, timeZone: string) {
  return DateTime.fromISO(dateInput, { zone: "utc" })
    .setZone(timeZone)
    .toFormat("yyyy-MM-dd");
}

function toLocalInputValue(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function formatEventTimeRange(startInput: string, endInput: string, timeZone?: string) {
  const zone = timeZone || localTimezone;

  const start = DateTime.fromISO(startInput, { zone: "utc" }).setZone(zone);
  const end = DateTime.fromISO(endInput, { zone: "utc" }).setZone(zone);

  const sameDay = start.hasSame(end, "day");

  if (sameDay) {
    return `${start.toFormat("MMM d, yyyy")} • ${start.toFormat("h:mm a")} - ${end.toFormat("h:mm a")}`;
  }

  return `${start.toFormat("MMM d, yyyy h:mm a")} - ${end.toFormat("MMM d, yyyy h:mm a")}`;
}

function formatFormTimeRange(startInput: string, endInput: string, timeZone?: string) {
  const zone = timeZone || localTimezone;

  const start = DateTime.fromISO(startInput, { zone });
  const end = DateTime.fromISO(endInput, { zone });

  if (!start.isValid || !end.isValid) return "—";

  const sameDay = start.hasSame(end, "day");

  if (sameDay) {
    return `${start.toFormat("MMM d, yyyy")} • ${start.toFormat("h:mm a")} - ${end.toFormat("h:mm a")}`;
  }

  return `${start.toFormat("MMM d, yyyy h:mm a")} - ${end.toFormat("MMM d, yyyy h:mm a")}`;
}

function formatEventDateTimeLine(
  startInput: string,
  endInput: string,
  timeZone?: string
) {
  const zone = timeZone || localTimezone;

  const start = DateTime.fromISO(startInput, { zone: "utc" }).setZone(zone);
  const end = DateTime.fromISO(endInput, { zone: "utc" }).setZone(zone);

  const datePart = start.toFormat("MMM d");
  const startTime = start.toFormat("h:mm a");
  const endTime = end.toFormat("h:mm a");

  return `${datePart} • ${startTime} - ${endTime}`;
}

function shortTimezoneLabel(dateInput: string, timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat(undefined, {
      timeZone,
      timeZoneName: "short",
      hour: "numeric",
    }).formatToParts(new Date(dateInput));

    return (
      parts.find((part) => part.type === "timeZoneName")?.value || timeZone
    );
  } catch {
    return timeZone;
  }
}

function longTimezoneLabel(timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat(undefined, {
      timeZone,
      timeZoneName: "long",
      hour: "numeric",
    }).formatToParts(new Date());

    return (
      parts.find((part) => part.type === "timeZoneName")?.value || timeZone
    );
  } catch {
    return timeZone;
  }
}

function timezoneOptionLabel(timeZone: string) {
  const shortLabel = shortTimezoneLabel(new Date().toISOString(), timeZone);
  const longLabel = longTimezoneLabel(timeZone);
  return `${timeZone} (${longLabel}, ${shortLabel})`;
}

function labelForType(type: EventType) {
  switch (type) {
    case "daily_scrum":
      return "Daily Scrum";
    case "sprint_planning":
      return "Sprint Planning";
    case "review":
      return "Review";
    case "retrospective":
      return "Retrospective";
    case "refinement":
      return "Refinement";
    case "deadline":
      return "Deadline";
    case "milestone":
      return "Milestone";
    default:
      return "Custom";
  }
}

function buildRRuleFromForm(form: EventFormState): string | null {
  switch (form.recurrencePreset) {
    case "one_time":
      return null;
    case "daily":
      return "FREQ=DAILY;INTERVAL=1";
    case "weekly":
      return "FREQ=WEEKLY;INTERVAL=1";
    case "monthly":
      return "FREQ=MONTHLY;INTERVAL=1";
    case "yearly":
      return "FREQ=YEARLY;INTERVAL=1";
    case "custom":
      return `FREQ=${unitToRRuleFreq(form.recurrenceUnit)};INTERVAL=${Math.max(
        1,
        form.recurrenceInterval
      )}`;
    default:
      return null;
  }
}

function unitToRRuleFreq(unit: RecurrenceUnit) {
  switch (unit) {
    case "day":
      return "DAILY";
    case "week":
      return "WEEKLY";
    case "month":
      return "MONTHLY";
    case "year":
      return "YEARLY";
    default:
      return "WEEKLY";
  }
}

function parseRRule(rrule: string | null): {
  preset: RecurrencePreset;
  interval: number;
  unit: RecurrenceUnit;
} {
  if (!rrule) {
    return {
      preset: "one_time",
      interval: 1,
      unit: "week",
    };
  }

  const parts = rrule.split(";").reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split("=");
    if (key && value) acc[key.toUpperCase()] = value.toUpperCase();
    return acc;
  }, {});

  const freq = parts.FREQ;
  const interval = Math.max(1, Number(parts.INTERVAL || "1"));

  if (freq === "DAILY" && interval === 1) {
    return { preset: "daily", interval: 1, unit: "day" };
  }

  if (freq === "WEEKLY" && interval === 1) {
    return { preset: "weekly", interval: 1, unit: "week" };
  }

  if (freq === "MONTHLY" && interval === 1) {
    return { preset: "monthly", interval: 1, unit: "month" };
  }

  if (freq === "YEARLY" && interval === 1) {
    return { preset: "yearly", interval: 1, unit: "year" };
  }

  if (freq === "DAILY") {
    return { preset: "custom", interval, unit: "day" };
  }

  if (freq === "WEEKLY") {
    return { preset: "custom", interval, unit: "week" };
  }

  if (freq === "MONTHLY") {
    return { preset: "custom", interval, unit: "month" };
  }

  if (freq === "YEARLY") {
    return { preset: "custom", interval, unit: "year" };
  }

  return { preset: "one_time", interval: 1, unit: "week" };
}

function isRepeatingForm(form: EventFormState) {
  return form.recurrencePreset !== "one_time";
}

function describeRecurrence(form: EventFormState) {
  switch (form.recurrencePreset) {
    case "one_time":
      return "One-time";
    case "daily":
      return "Daily";
    case "weekly":
      return "Weekly";
    case "monthly":
      return "Monthly";
    case "yearly":
      return "Yearly";
    case "custom":
      return `Every ${form.recurrenceInterval} ${pluralizeUnit(
        form.recurrenceUnit,
        form.recurrenceInterval
      )}`;
    default:
      return "One-time";
  }
}

function pluralizeUnit(unit: RecurrenceUnit, interval: number) {
  const base =
    unit === "day"
      ? "day"
      : unit === "week"
      ? "week"
      : unit === "month"
      ? "month"
      : "year";

  return interval === 1 ? base : `${base}s`;
}

function expandEventsForRange(
  events: ProjectEvent[],
  rangeStart: Date,
  rangeEnd: Date
): EventOccurrence[] {
  const expanded: EventOccurrence[] = [];
  const rangeStartUtc = DateTime.fromJSDate(rangeStart).toUTC();
  const rangeEndUtc = DateTime.fromJSDate(rangeEnd).toUTC();

  for (const event of events) {
    const zone = event.timezone || localTimezone;

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

    const baseStart = DateTime.fromISO(event.start_at, { zone: "utc" }).setZone(zone);
    const baseEnd = DateTime.fromISO(event.end_at, { zone: "utc" }).setZone(zone);
    const durationMs = baseEnd.toMillis() - baseStart.toMillis();

    let cursor = baseStart;
    let guard = 0;

    while (cursor.toUTC() <= rangeEndUtc && guard < 500) {
      const occurrenceEnd = DateTime.fromMillis(cursor.toMillis() + durationMs, {
        zone,
      });

      if (occurrenceEnd.toUTC() >= rangeStartUtc && cursor.toUTC() <= rangeEndUtc) {
        expanded.push({
          instanceId: `${event.id}-${cursor.toUTC().toISO()}`,
          sourceEvent: event,
          occurrenceStart: cursor.toUTC().toISO()!,
          occurrenceEnd: occurrenceEnd.toUTC().toISO()!,
        });
      }

      cursor = addInterval(cursor, interval, unit);
      guard += 1;
    }
  }

  return expanded;
}

function addInterval(date: DateTime, interval: number, unit: RecurrenceUnit) {
  if (unit === "day") return date.plus({ days: interval });
  if (unit === "week") return date.plus({ weeks: interval });
  if (unit === "month") return date.plus({ months: interval });
  return date.plus({ years: interval });
}

const styles: Record<string, CSSProperties> = {
  shell: {
    minHeight: "100vh",
    width: "100%",
    background: "#0b0f17",
    color: "white",
    padding: 24,
    boxSizing: "border-box",
  },
  page: {
    width: "100%",
    maxWidth: 1400,
    margin: "0 auto",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 18,
    flexWrap: "wrap",
  },
  eyebrow: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  title: {
    margin: 0,
    fontSize: 34,
    lineHeight: 1.05,
  },
  subtitle: {
    marginTop: 8,
    color: "rgba(255,255,255,0.72)",
    fontSize: 15,
  },
  headerActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
    flexWrap: "wrap",
  },
  monthControls: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  monthLabel: {
    minWidth: 220,
    textAlign: "center",
    fontSize: 20,
    fontWeight: 700,
  },
  primaryButton: {
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "white",
    border: "none",
    borderRadius: 12,
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    background: "#151c2c",
    color: "white",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: "10px 14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  deleteButton: {
    background: "rgba(239,68,68,0.14)",
    color: "#fecaca",
    border: "1px solid rgba(239,68,68,0.35)",
    borderRadius: 12,
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  deleteChoiceButton: {
    background: "#151c2c",
    color: "#fca5a5",
    border: "1px solid rgba(252,165,165,0.25)",
    borderRadius: 12,
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  deleteChoiceWrap: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#151c2c",
    color: "white",
    cursor: "pointer",
    fontSize: 18,
  },
  card: {
    background: "#111827",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 18,
    padding: 18,
  },
  calendarCard: {
    background: "#111827",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 22,
    overflow: "hidden",
    boxShadow: "0 16px 40px rgba(0,0,0,0.28)",
  },
  weekHeader: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    background: "#0f172a",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  weekHeaderCell: {
    padding: 14,
    textAlign: "center",
    fontWeight: 700,
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
  },
  dayCell: {
    minHeight: 190,
    maxHeight: 190,
    padding: 10,
    borderRight: "1px solid rgba(255,255,255,0.05)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    background: "#111827",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    cursor: "pointer",
  },
  dayCellMuted: {
    background: "#0d1422",
  },
  dayTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexShrink: 0,
  },
  dayNumber: {
    background: "transparent",
    color: "white",
    border: "none",
    width: 32,
    height: 32,
    borderRadius: 999,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    lineHeight: 1,
    flexShrink: 0,
  },
  dayNumberMuted: {
    color: "rgba(255,255,255,0.35)",
  },
  todayBadge: {
    background: "#2563eb",
  },
  eventsList: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    overflowY: "auto",
    minHeight: 0,
    flex: 1,
    paddingRight: 2,
  },
  eventChip: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    width: "100%",
    padding: "7px 8px",
    borderRadius: 10,
    border: "1px solid transparent",
    color: "white",
    cursor: "pointer",
    textAlign: "left",
    flexShrink: 0,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    flexShrink: 0,
    marginTop: 4,
  },
  eventChipContent: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    gap: 2,
    flex: 1,
  },
  eventTitleText: {
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  eventMetaText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.72)",
    lineHeight: 1.25,
    whiteSpace: "normal",
    overflowWrap: "anywhere",
  },
  emptyDayText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    padding: "4px 2px",
  },
  moreText: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 12,
    marginTop: 2,
  },
  legendCard: {
    marginTop: 18,
    background: "#111827",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 18,
    padding: 16,
  },
  legendTitle: {
    fontWeight: 700,
    marginBottom: 10,
  },
  legendWrap: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "rgba(255,255,255,0.82)",
    fontSize: 14,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  infoText: {
    color: "rgba(255,255,255,0.75)",
  },
  errorText: {
    color: "#fca5a5",
    fontWeight: 600,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    zIndex: 50,
  },
  modalCard: {
    width: "100%",
    maxWidth: 760,
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 22,
    boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
    padding: 20,
    maxHeight: "90vh",
    overflowY: "auto",
  },
  dayModalCard: {
    width: "100%",
    maxWidth: 680,
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 22,
    boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
    padding: 20,
    maxHeight: "85vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  dayModalList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    overflowY: "auto",
    paddingRight: 4,
  },
  dayModalEmpty: {
    color: "rgba(255,255,255,0.72)",
    padding: "8px 2px",
  },
  dayModalEvent: {
    width: "100%",
    textAlign: "left",
    background: "#111827",
    color: "white",
    border: "1px solid rgba(255,255,255,0.06)",
    borderLeft: "4px solid",
    borderRadius: 14,
    padding: "12px 14px",
    cursor: "pointer",
  },
  dayModalEventTitle: {
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 4,
  },
  dayModalEventMeta: {
    fontSize: 13,
    color: "rgba(255,255,255,0.72)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 800,
  },
  modalSubtitle: {
    marginTop: 6,
    color: "rgba(255,255,255,0.68)",
    fontSize: 14,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#151c2c",
    color: "white",
    cursor: "pointer",
    fontSize: 16,
    flexShrink: 0,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
  },
  fieldFull: {
    gridColumn: "1 / -1",
  },
  label: {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    color: "rgba(255,255,255,0.72)",
    fontWeight: 600,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    background: "#111827",
    color: "white",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: "11px 12px",
    outline: "none",
  },
  textarea: {
    width: "100%",
    minHeight: 110,
    resize: "vertical",
    boxSizing: "border-box",
    background: "#111827",
    color: "white",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: "11px 12px",
    outline: "none",
    fontFamily: "inherit",
  },
  repeatButtonRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  repeatButton: {
    background: "#111827",
    color: "rgba(255,255,255,0.86)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 999,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 600,
  },
  repeatButtonActive: {
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "white",
    border: "1px solid rgba(37,99,235,0.85)",
    boxShadow: "0 0 0 3px rgba(37,99,235,0.18)",
  },
  modalActions: {
    marginTop: 18,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  modalActionsRight: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  previewCard: {
    marginTop: 18,
    background: "#111827",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
  },
  previewTitle: {
    fontWeight: 700,
    marginBottom: 10,
  },
  previewRow: {
    display: "flex",
    gap: 8,
    marginBottom: 6,
    color: "rgba(255,255,255,0.82)",
  },
  previewLabel: {
    width: 78,
    color: "rgba(255,255,255,0.58)",
  },
  calendarNavControls: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  navSelect: {
    background: "#151c2c",
    color: "white",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: "10px 14px",
    fontWeight: 600,
    cursor: "pointer",
    outline: "none",
  },
};