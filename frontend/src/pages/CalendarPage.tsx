import { useEffect, useMemo, useState } from "react";
import type { JSX } from "react";
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
  occurrenceStart: string;
  occurrenceEnd: string;
};

type EventFormState = {
  id?: string;
  title: string;
  type: EventType;
  start_at: string;
  end_at: string;
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

const recurrenceOptions: Array<{ key: RecurrencePreset; label: string }> = [
  { key: "one_time", label: "One-time" },
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
  { key: "custom", label: "Custom" },
];

const typeColors: Record<EventType, { bg: string; border: string; text: string; dot: string; label: string }> = {
  daily_scrum:     { bg: "#dbeafe", border: "#93c5fd", text: "#1d4ed8", dot: "#3b82f6",  label: "Daily Scrum" },
  sprint_planning: { bg: "#ede9fe", border: "#c4b5fd", text: "#5b21b6", dot: "#8b5cf6",  label: "Sprint Planning" },
  review:          { bg: "#d1fae5", border: "#6ee7b7", text: "#065f46", dot: "#10b981",  label: "Review" },
  retrospective:   { bg: "#fef3c7", border: "#fcd34d", text: "#92400e", dot: "#f59e0b",  label: "Retrospective" },
  refinement:      { bg: "#fce7f3", border: "#f9a8d4", text: "#9d174d", dot: "#ec4899",  label: "Refinement" },
  deadline:        { bg: "#fee2e2", border: "#fca5a5", text: "#991b1b", dot: "#ef4444",  label: "Deadline" },
  milestone:       { bg: "#dcfce7", border: "#86efac", text: "#14532d", dot: "#22c55e",  label: "Milestone" },
  custom:          { bg: "#f1f5f9", border: "#cbd5e1", text: "#475569", dot: "#94a3b8",  label: "Custom" },
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
        const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
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

  const visibleOccurrences = useMemo(
    () => expandEventsForRange(events, visibleRange.start, visibleRange.end),
    [events, visibleRange]
  );

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
    setForm({ ...emptyForm, start_at: toLocalInputValue(start), end_at: toLocalInputValue(end), timezone: localTimezone });
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
      end_at: DateTime.fromISO(event.end_at, { zone: "utc" }).setZone(zone).toFormat("yyyy-MM-dd'T'HH:mm"),
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
    const unitMap: Record<string, RecurrenceUnit> = { daily: "day", weekly: "week", monthly: "month", yearly: "year" };
    if (preset === "one_time") {
      setForm((p) => ({ ...p, recurrencePreset: preset, recurrenceInterval: 1, recurrenceUnit: "week", rrule: "" }));
    } else if (unitMap[preset]) {
      setForm((p) => ({ ...p, recurrencePreset: preset, recurrenceInterval: 1, recurrenceUnit: unitMap[preset] }));
    } else {
      setForm((p) => ({ ...p, recurrencePreset: preset, recurrenceInterval: Math.max(1, p.recurrenceInterval || 1) }));
    }
  }

  async function handleSave() {
    if (!projectId) return;
    if (!form.title.trim()) { alert("Please enter an event title."); return; }
    if (!form.start_at || !form.end_at) { alert("Please enter both a start and end time."); return; }
    if (!form.timezone.trim()) { alert("Please select a timezone."); return; }
    const startLocal = DateTime.fromISO(form.start_at, { zone: form.timezone });
    const endLocal = DateTime.fromISO(form.end_at, { zone: form.timezone });
    if (!startLocal.isValid || !endLocal.isValid) { alert("Please enter valid start and end times."); return; }
    if (endLocal <= startLocal) { alert("End time must be after start time."); return; }
    if (form.recurrencePreset === "custom" && form.recurrenceInterval < 1) { alert("Custom repeat interval must be at least 1."); return; }
    try {
      setSaving(true);
      const rrule = buildRRuleFromForm(form);
      const payload = {
        title: form.title.trim(),
        type: form.type,
        start_at: startLocal.toUTC().toISO(),
        end_at: endLocal.toUTC().toISO(),
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
    const confirmed = window.confirm(isRepeatingForm(form) ? "Delete this repeating event series?" : "Delete this event?");
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
    alert("Deleting only one occurrence of a repeating event is not supported by the current backend yet. You can delete the full repeating series.");
  }

  const bg            = isDark ? "#0f172a" : "#f8fafc";
  const surface       = isDark ? "#1e293b" : "#ffffff";
  const surfaceRaised = isDark ? "#253347" : "#f1f5f9";
  const border        = isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0";
  const borderLight   = isDark ? "rgba(255,255,255,0.06)" : "#f0f4f8";
  const textPrimary   = isDark ? "#f1f5f9" : "#0f172a";
  const textSecondary = isDark ? "#94a3b8" : "#64748b";
  const headerBg      = isDark ? "#162032" : "#f8fafc";
  const cellBg        = isDark ? "#1a2639" : "#ffffff";
  const cellMuted     = cellBg;
  const cellWeekend   = cellBg;
  const inputBg       = isDark ? "#162032" : "#ffffff";
  const calendarIconColor = isDark ? "#ffffff" : "#0f172a";

  return (
    <SidebarLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
        .cal-root * { font-family: 'DM Sans', system-ui, sans-serif; box-sizing: border-box; }

        .cal-day { transition: background 0.1s; }
        .cal-day:hover { background: ${isDark ? "rgba(255,255,255,0.04)" : "#eef2ff"} !important; }

        .cal-chip { transition: filter 0.12s, transform 0.12s; cursor: pointer; }
        .cal-chip:hover { filter: brightness(0.92); transform: translateY(-1px); }

        .cal-btn-primary { transition: opacity 0.12s, transform 0.12s; }
        .cal-btn-primary:hover:not(:disabled) { opacity: 0.87; transform: translateY(-1px); }

        .cal-btn-secondary { transition: background 0.12s; }
        .cal-btn-secondary:hover:not(:disabled) { background: ${isDark ? "rgba(255,255,255,0.12)" : "#e2e8f0"} !important; }

        .cal-icon-btn { transition: background 0.12s; }
        .cal-icon-btn:hover { background: ${isDark ? "rgba(255,255,255,0.12)" : "#e2e8f0"} !important; }

        .cal-day-event-btn { transition: filter 0.12s; cursor: pointer; }
        .cal-day-event-btn:hover { filter: brightness(0.95); }

        .cal-repeat-btn { transition: all 0.12s; }

        .cal-scroll::-webkit-scrollbar { width: 4px; }
        .cal-scroll::-webkit-scrollbar-track { background: transparent; }
        .cal-scroll::-webkit-scrollbar-thumb { background: ${isDark ? "rgba(255,255,255,0.18)" : "#cbd5e1"}; border-radius: 4px; }

        .cal-input:focus { outline: none !important; border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.18) !important; }

        .cal-select option { background: ${isDark ? "#1e293b" : "#ffffff"}; color: ${textPrimary}; }

        .cal-datetime-wrap {
          position: relative;
        }

        .cal-datetime {
          color-scheme: ${isDark ? "dark" : "light"};
          padding-right: 42px !important;
        }

        .cal-datetime::-webkit-calendar-picker-indicator {
          opacity: 0;
          position: absolute;
          right: 0;
          width: 42px;
          height: 100%;
          cursor: pointer;
        }

        .cal-datetime-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          color: ${calendarIconColor};
          pointer-events: none;
          opacity: 0.95;
        }
      `}</style>

      <div className="cal-root" style={{ minHeight: "100vh", width: "100%", background: bg, color: textPrimary, padding: "28px 24px" }}>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: "100%", maxWidth: 1440, margin: "0 auto" }}
        >

          {/* ── Page Header ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 26, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: textSecondary, marginBottom: 5 }}>
                Project Workspace
              </div>
              <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: "-0.5px", color: textPrimary }}>Calendar</h1>
              <p style={{ margin: "5px 0 0", fontSize: 14, color: textSecondary }}>View, create, edit, and manage project events.</p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button
                className="cal-btn-secondary"
                style={{ background: surfaceRaised, color: textPrimary, border: `1px solid ${border}`, borderRadius: 10, padding: "9px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
                onClick={() => {
                  let route = "developer-dashboard";
                  if (role === "product-owner") route = "product-owner-dashboard";
                  else if (role === "scrum-facilitator") route = "scrum-facilitator-dashboard";
                  navigate(`/projects/${projectId}/${role}/${route}`);
                }}
              >
                ← Back to Project
              </button>
              <button
                className="cal-btn-primary"
                style={{ background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
                onClick={() => openCreateModal(new Date())}
              >
                + New Event
              </button>
            </div>
          </div>

          {/* ── Toolbar ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                className="cal-icon-btn"
                style={{ width: 36, height: 36, borderRadius: 9, border: `1px solid ${border}`, background: surfaceRaised, color: textPrimary, cursor: "pointer", fontSize: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}
                onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
              >‹</button>
              <span style={{ minWidth: 190, textAlign: "center", fontSize: 17, fontWeight: 700, letterSpacing: "-0.3px", color: textPrimary }}>
                {currentMonth.toLocaleString(undefined, { month: "long", year: "numeric" })}
              </span>
              <button
                className="cal-icon-btn"
                style={{ width: 36, height: 36, borderRadius: 9, border: `1px solid ${border}`, background: surfaceRaised, color: textPrimary, cursor: "pointer", fontSize: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >›</button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <button
                className="cal-btn-secondary"
                style={{ background: surfaceRaised, color: textPrimary, border: `1px solid ${border}`, borderRadius: 10, padding: "8px 15px", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                onClick={() => setCurrentMonth(startOfMonth(new Date()))}
              >
                Today
              </button>
              <select
                className="cal-select"
                style={{ background: surfaceRaised, color: textPrimary, border: `1px solid ${border}`, borderRadius: 10, padding: "8px 12px", fontWeight: 600, fontSize: 13, cursor: "pointer", outline: "none", fontFamily: "inherit" }}
                value={currentMonth.getMonth()}
                onChange={(e) => setCurrentMonth(new Date(currentMonth.getFullYear(), Number(e.target.value), 1))}
              >
                {monthOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select
                className="cal-select"
                style={{ background: surfaceRaised, color: textPrimary, border: `1px solid ${border}`, borderRadius: 10, padding: "8px 12px", fontWeight: 600, fontSize: 13, cursor: "pointer", outline: "none", fontFamily: "inherit" }}
                value={currentMonth.getFullYear()}
                onChange={(e) => setCurrentMonth(new Date(Number(e.target.value), currentMonth.getMonth(), 1))}
              >
                {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* ── Calendar Grid ── */}
          {loading ? (
            <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 18, padding: "44px 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: textSecondary, fontSize: 15 }}>Loading calendar…</span>
            </div>
          ) : error ? (
            <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 18, padding: "44px 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#dc2626", fontWeight: 600 }}>⚠ {error}</span>
            </div>
          ) : (
            <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 18, overflow: "hidden", boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 2px 16px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: headerBg, borderBottom: `1px solid ${border}` }}>
                {weekdayLabels.map((d) => (
                  <div key={d} style={{ padding: "12px 10px", textAlign: "center", fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: textSecondary }}>
                    {d}
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
                {calendarDays.map((day) => {
                  const key = formatLocalDateKey(day.date);
                  const dayEvents = eventsByDate.get(key) ?? [];
                  const isCurrentMonth = day.isCurrentMonth;
                  const isTodayVal = isToday(day.date);

                  return (
                    <div
                      key={key}
                      className="cal-day"
                      style={{
                        minHeight: 155,
                        maxHeight: 155,
                        padding: "9px 9px 7px",
                        borderRight: `1px solid ${borderLight}`,
                        borderBottom: `1px solid ${borderLight}`,
                        background: isCurrentMonth ? cellBg : cellMuted,
                        display: "flex",
                        flexDirection: "column",
                        gap: 5,
                        cursor: "pointer",
                      }}
                      onClick={() => openDayModal(day.date)}
                      onDoubleClick={() => openCreateModal(day.date)}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                        <button
                          style={{
                            width: 27,
                            height: 27,
                            borderRadius: 7,
                            border: "none",
                            background: isTodayVal ? "#3b82f6" : "transparent",
                            color: isTodayVal ? "#fff" : isCurrentMonth ? textPrimary : textSecondary,
                            fontWeight: isTodayVal ? 700 : isCurrentMonth ? 600 : 400,
                            fontSize: 13,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                            opacity: isCurrentMonth ? 1 : 0.4,
                            fontFamily: "inherit",
                          }}
                          onClick={(e) => { e.stopPropagation(); openDayModal(day.date); }}
                        >
                          {day.date.getDate()}
                        </button>
                        {dayEvents.length > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 600, color: textSecondary, lineHeight: 1 }}>
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      <div className="cal-scroll" style={{ display: "flex", flexDirection: "column", gap: 3, overflowY: "auto", flex: 1, minHeight: 0 }}>
                        {dayEvents.map((occ) => {
                          const ev = occ.sourceEvent;
                          const zone = ev.timezone || localTimezone;
                          const zs = shortTimezoneLabel(occ.occurrenceStart, zone);
                          const c = typeColors[ev.type];
                          return (
                            <button
                              key={occ.instanceId}
                              className="cal-chip"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                width: "100%",
                                padding: "4px 7px",
                                borderRadius: 6,
                                border: `1px solid ${c.border}`,
                                background: c.bg,
                                color: c.text,
                                textAlign: "left",
                                flexShrink: 0,
                              }}
                              onClick={(e) => { e.stopPropagation(); openEditModal(ev); }}
                              title={`${ev.title} • ${formatEventTimeRange(occ.occurrenceStart, occ.occurrenceEnd, zone)} • ${zone}`}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
                              <span style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.35 }}>
                                  {ev.title}
                                </span>
                                <span style={{ fontSize: 10, fontWeight: 500, lineHeight: 1.3, opacity: 0.75, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {formatEventTimeLine(occ.occurrenceStart, zone)} {zs}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ marginTop: 14, background: surface, border: `1px solid ${border}`, borderRadius: 14, padding: "12px 18px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: textSecondary, flexShrink: 0 }}>Event Types</span>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {(Object.keys(typeColors) as EventType[]).map((type) => (
                <div key={type} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: typeColors[type].dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: textPrimary, fontWeight: 500 }}>{typeColors[type].label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {dayModalOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50, backdropFilter: "blur(3px)" }} onClick={closeDayModal}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: "100%", maxWidth: 520, background: isDark ? "#1e293b" : "#ffffff", border: `1px solid ${border}`, borderRadius: 20, boxShadow: isDark ? "0 20px 60px rgba(0,0,0,0.5)" : "0 12px 40px rgba(0,0,0,0.14)", padding: 24, maxHeight: "88vh", display: "flex", flexDirection: "column" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px", color: textPrimary }}>
                    {selectedDay?.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                  </div>
                  <div style={{ marginTop: 3, fontSize: 13, color: textSecondary }}>
                    {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? "s" : ""} scheduled
                  </div>
                </div>
                <button
                  className="cal-icon-btn"
                  style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${border}`, background: surfaceRaised, color: textSecondary, cursor: "pointer", fontSize: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", flexShrink: 0 }}
                  onClick={closeDayModal}
                >✕</button>
              </div>

              <div className="cal-scroll" style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", flex: 1 }}>
                {selectedDayEvents.length === 0 ? (
                  <div style={{ padding: "28px 0", textAlign: "center", color: textSecondary, fontSize: 14 }}>
                    No events scheduled
                  </div>
                ) : (
                  selectedDayEvents.map((occ) => {
                    const ev = occ.sourceEvent;
                    const zone = ev.timezone || localTimezone;
                    const zs = shortTimezoneLabel(occ.occurrenceStart, zone);
                    const c = typeColors[ev.type];
                    return (
                      <button
                        key={occ.instanceId}
                        className="cal-day-event-btn"
                        style={{
                          width: "100%",
                          textAlign: "left",
                          background: c.bg,
                          color: c.text,
                          border: `1px solid ${c.border}`,
                          borderLeft: `4px solid ${c.dot}`,
                          borderRadius: 12,
                          padding: "11px 13px",
                          cursor: "pointer",
                        }}
                        onClick={() => { closeDayModal(); openEditModal(ev); }}
                      >
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3, opacity: 0.65 }}>
                          {c.label}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2, letterSpacing: "-0.2px" }}>{ev.title}</div>
                        <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.8 }}>
                          {formatEventDateTimeLine(occ.occurrenceStart, occ.occurrenceEnd, zone)} ({zs})
                        </div>
                        {ev.location && (
                          <div style={{ marginTop: 3, fontSize: 12, opacity: 0.6 }}>📍 {ev.location}</div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0 }}>
                <button
                  className="cal-btn-secondary"
                  style={{ background: surfaceRaised, color: textPrimary, border: `1px solid ${border}`, borderRadius: 10, padding: "9px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
                  onClick={closeDayModal}
                >Close</button>
                <button
                  className="cal-btn-primary"
                  style={{ background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
                  onClick={() => { closeDayModal(); openCreateModal(selectedDay ?? new Date()); }}
                >+ Add Event</button>
              </div>
            </motion.div>
          </div>
        )}

        {modalOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50, backdropFilter: "blur(3px)" }} onClick={closeModal}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: "100%", maxWidth: 700, background: isDark ? "#1e293b" : "#ffffff", border: `1px solid ${border}`, borderRadius: 20, boxShadow: isDark ? "0 20px 60px rgba(0,0,0,0.5)" : "0 12px 40px rgba(0,0,0,0.14)", padding: 26, maxHeight: "90vh", overflowY: "auto" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 22 }}>
                <div>
                  <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-0.4px", color: textPrimary }}>{form.id ? "Edit Event" : "New Event"}</div>
                  <div style={{ marginTop: 3, fontSize: 13, color: textSecondary }}>
                    {selectedDate?.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) ?? "Project event"}
                  </div>
                </div>
                <button
                  className="cal-icon-btn"
                  style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${border}`, background: surfaceRaised, color: textSecondary, cursor: "pointer", fontSize: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", flexShrink: 0 }}
                  onClick={closeModal}
                >✕</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 14 }}>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: textSecondary }}>Title</label>
                  <input
                    className="cal-input"
                    style={{ width: "100%", background: inputBg, color: textPrimary, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, fontFamily: "inherit" }}
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Enter event title"
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: textSecondary }}>Type</label>
                  <select
                    className="cal-select cal-input"
                    style={{ width: "100%", background: inputBg, color: textPrimary, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", cursor: "pointer", outline: "none" }}
                    value={form.type}
                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as EventType }))}
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
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: textSecondary }}>Timezone</label>
                  <select
                    className="cal-select cal-input"
                    style={{ width: "100%", background: inputBg, color: textPrimary, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", cursor: "pointer", outline: "none" }}
                    value={form.timezone}
                    onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
                  >
                    {timezones.map((tz) => <option key={tz} value={tz}>{timezoneOptionLabel(tz)}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: textSecondary }}>Start</label>
                  <div className="cal-datetime-wrap">
                    <input
                      className="cal-input cal-datetime"
                      type="datetime-local"
                      style={{ width: "100%", background: inputBg, color: textPrimary, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, fontFamily: "inherit" }}
                      value={form.start_at}
                      onChange={(e) => setForm((p) => ({ ...p, start_at: e.target.value }))}
                    />
                    <svg
                      className="cal-datetime-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M8 2V5M16 2V5M3 9H21M5 5H19C20.1046 5 21 5.89543 21 7V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V7C3 5.89543 3.89543 5 5 5Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: textSecondary }}>End</label>
                  <div className="cal-datetime-wrap">
                    <input
                      className="cal-input cal-datetime"
                      type="datetime-local"
                      style={{ width: "100%", background: inputBg, color: textPrimary, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, fontFamily: "inherit" }}
                      value={form.end_at}
                      onChange={(e) => setForm((p) => ({ ...p, end_at: e.target.value }))}
                    />
                    <svg
                      className="cal-datetime-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M8 2V5M16 2V5M3 9H21M5 5H19C20.1046 5 21 5.89543 21 7V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V7C3 5.89543 3.89543 5 5 5Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: textSecondary }}>Repeats</label>
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                    {recurrenceOptions.map((opt) => {
                      const active = form.recurrencePreset === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          className="cal-repeat-btn"
                          style={{
                            background: active ? "#3b82f6" : surfaceRaised,
                            color: active ? "#fff" : textPrimary,
                            border: active ? "1px solid #3b82f6" : `1px solid ${border}`,
                            borderRadius: 999,
                            padding: "7px 15px",
                            cursor: "pointer",
                            fontWeight: active ? 700 : 500,
                            fontSize: 13,
                            fontFamily: "inherit",
                          }}
                          onClick={() => updateRecurrencePreset(opt.key)}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {form.recurrencePreset === "custom" && (
                  <>
                    <div>
                      <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: textSecondary }}>Repeat Every</label>
                      <input
                        className="cal-input"
                        type="number"
                        min={1}
                        style={{ width: "100%", background: inputBg, color: textPrimary, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, fontFamily: "inherit" }}
                        value={form.recurrenceInterval}
                        onChange={(e) => setForm((p) => ({ ...p, recurrenceInterval: Math.max(1, Number(e.target.value) || 1) }))}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: textSecondary }}>Unit</label>
                      <select
                        className="cal-select cal-input"
                        style={{ width: "100%", background: inputBg, color: textPrimary, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", cursor: "pointer", outline: "none" }}
                        value={form.recurrenceUnit}
                        onChange={(e) => setForm((p) => ({ ...p, recurrenceUnit: e.target.value as RecurrenceUnit }))}
                      >
                        <option value="day">Days</option>
                        <option value="week">Weeks</option>
                        <option value="month">Months</option>
                        <option value="year">Years</option>
                      </select>
                    </div>
                  </>
                )}

                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: textSecondary }}>Location</label>
                  <input
                    className="cal-input"
                    style={{ width: "100%", background: inputBg, color: textPrimary, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, fontFamily: "inherit" }}
                    value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    placeholder="Optional location"
                  />
                </div>

                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: textSecondary }}>Description</label>
                  <textarea
                    className="cal-input cal-scroll"
                    style={{ width: "100%", background: inputBg, color: textPrimary, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", minHeight: 90, resize: "vertical" }}
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Add event details"
                  />
                </div>
              </div>

              <div style={{ marginTop: 16, background: surfaceRaised, border: `1px solid ${border}`, borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: textSecondary, marginBottom: 9 }}>Preview</div>
                <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "5px 10px", fontSize: 13 }}>
                  {([
                    ["Time", form.start_at && form.end_at ? formatFormTimeRange(form.start_at, form.end_at, form.timezone) : "—"],
                    ["Timezone", form.timezone ? timezoneOptionLabel(form.timezone) : "—"],
                    ["Type", typeColors[form.type]?.label ?? labelForType(form.type)],
                    ["Repeats", describeRecurrence(form)],
                    ["Location", form.location || "—"],
                  ] as [string, string][]).map(([label, value], i) => (
                    <>
                      <span key={`l${i}`} style={{ color: textSecondary, fontWeight: 500 }}>{label}</span>
                      <span key={`v${i}`} style={{ color: textPrimary }}>{value}</span>
                    </>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {form.id && !isRepeatingForm(form) && (
                    <button
                      style={{
                        background: "#dc2626",
                        color: "#ffffff",
                        border: "1px solid #ef4444",
                        borderRadius: 10,
                        padding: "9px 16px",
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        boxShadow: isDark ? "0 0 0 1px rgba(255,255,255,0.04) inset" : "none",
                      }}
                      onClick={handleDeleteSeries}
                      disabled={saving}
                    >
                      Delete Event
                    </button>
                  )}
                  {form.id && isRepeatingForm(form) && (
                    <>
                      <button
                        style={{ background: "transparent", color: "#ef4444", border: "1px solid #ef4444", borderRadius: 10, padding: "9px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
                        onClick={handleDeleteSingleOccurrence}
                        disabled={saving}
                      >
                        Delete This Only
                      </button>
                      <button
                        style={{
                          background: "#dc2626",
                          color: "#ffffff",
                          border: "1px solid #ef4444",
                          borderRadius: 10,
                          padding: "9px 16px",
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          boxShadow: isDark ? "0 0 0 1px rgba(255,255,255,0.04) inset" : "none",
                        }}
                        onClick={handleDeleteSeries}
                        disabled={saving}
                      >
                        Delete Series
                      </button>
                    </>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="cal-btn-secondary"
                    style={{ background: surfaceRaised, color: textPrimary, border: `1px solid ${border}`, borderRadius: 10, padding: "9px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className="cal-btn-primary"
                    style={{ background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving…" : form.id ? "Update Event" : "Create Event"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCalendarGrid(monthDate: Date) {
  const start = startOfWeek(startOfMonth(monthDate));
  const end = endOfWeek(endOfMonth(monthDate));
  const days: { date: Date; isCurrentMonth: boolean }[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push({ date: new Date(cursor), isCurrentMonth: cursor.getMonth() === monthDate.getMonth() });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function startOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function endOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth() + 1, 0); }
function startOfWeek(date: Date) { const d = new Date(date); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - d.getDay()); return d; }
function endOfWeek(date: Date) { const d = new Date(date); d.setHours(23, 59, 59, 999); d.setDate(d.getDate() + (6 - d.getDay())); return d; }
function addMonths(date: Date, n: number) { return new Date(date.getFullYear(), date.getMonth() + n, 1); }
function isToday(date: Date) { const n = new Date(); return date.getFullYear() === n.getFullYear() && date.getMonth() === n.getMonth() && date.getDate() === n.getDate(); }
function formatLocalDateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function formatUtcIsoToDateKeyInZone(s: string, tz: string) { return DateTime.fromISO(s, { zone: "utc" }).setZone(tz).toFormat("yyyy-MM-dd"); }
function toLocalInputValue(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`; }

function formatEventTimeRange(s: string, e: string, tz?: string) {
  const z = tz || localTimezone;
  const a = DateTime.fromISO(s, { zone: "utc" }).setZone(z);
  const b = DateTime.fromISO(e, { zone: "utc" }).setZone(z);
  return a.hasSame(b, "day")
    ? `${a.toFormat("MMM d, yyyy")} • ${a.toFormat("h:mm a")} – ${b.toFormat("h:mm a")}`
    : `${a.toFormat("MMM d, yyyy h:mm a")} – ${b.toFormat("MMM d, yyyy h:mm a")}`;
}

function formatFormTimeRange(s: string, e: string, tz?: string) {
  const z = tz || localTimezone;
  const a = DateTime.fromISO(s, { zone: z });
  const b = DateTime.fromISO(e, { zone: z });
  if (!a.isValid || !b.isValid) return "—";
  return a.hasSame(b, "day")
    ? `${a.toFormat("MMM d, yyyy")} • ${a.toFormat("h:mm a")} – ${b.toFormat("h:mm a")}`
    : `${a.toFormat("MMM d, yyyy h:mm a")} – ${b.toFormat("MMM d, yyyy h:mm a")}`;
}

function formatEventDateTimeLine(s: string, e: string, tz?: string) {
  const z = tz || localTimezone;
  const a = DateTime.fromISO(s, { zone: "utc" }).setZone(z);
  const b = DateTime.fromISO(e, { zone: "utc" }).setZone(z);
  return `${a.toFormat("MMM d")} • ${a.toFormat("h:mm a")} – ${b.toFormat("h:mm a")}`;
}

function formatEventTimeLine(s: string, tz?: string) {
  return DateTime.fromISO(s, { zone: "utc" }).setZone(tz || localTimezone).toFormat("h:mm a");
}

function shortTimezoneLabel(d: string, tz: string) {
  try {
    const parts = new Intl.DateTimeFormat(undefined, { timeZone: tz, timeZoneName: "short", hour: "numeric" }).formatToParts(new Date(d));
    return parts.find((p) => p.type === "timeZoneName")?.value || tz;
  } catch { return tz; }
}

function longTimezoneLabel(tz: string) {
  try {
    const parts = new Intl.DateTimeFormat(undefined, { timeZone: tz, timeZoneName: "long", hour: "numeric" }).formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value || tz;
  } catch { return tz; }
}

function timezoneOptionLabel(tz: string) {
  return `${tz} (${longTimezoneLabel(tz)}, ${shortTimezoneLabel(new Date().toISOString(), tz)})`;
}

function labelForType(type: EventType): string {
  return typeColors[type]?.label ?? "Custom";
}

function buildRRuleFromForm(form: EventFormState): string | null {
  switch (form.recurrencePreset) {
    case "one_time": return null;
    case "daily": return "FREQ=DAILY;INTERVAL=1";
    case "weekly": return "FREQ=WEEKLY;INTERVAL=1";
    case "monthly": return "FREQ=MONTHLY;INTERVAL=1";
    case "yearly": return "FREQ=YEARLY;INTERVAL=1";
    case "custom": return `FREQ=${unitToFreq(form.recurrenceUnit)};INTERVAL=${Math.max(1, form.recurrenceInterval)}`;
    default: return null;
  }
}

function unitToFreq(u: RecurrenceUnit) {
  return { day: "DAILY", week: "WEEKLY", month: "MONTHLY", year: "YEARLY" }[u] ?? "WEEKLY";
}

function parseRRule(rrule: string | null): { preset: RecurrencePreset; interval: number; unit: RecurrenceUnit } {
  if (!rrule) return { preset: "one_time", interval: 1, unit: "week" };
  const parts = rrule.split(";").reduce<Record<string, string>>((a, p) => {
    const [k, v] = p.split("=");
    if (k && v) a[k.toUpperCase()] = v.toUpperCase();
    return a;
  }, {});
  const freq = parts.FREQ;
  const interval = Math.max(1, Number(parts.INTERVAL || "1"));
  const unitMap: Record<string, RecurrenceUnit> = { DAILY: "day", WEEKLY: "week", MONTHLY: "month", YEARLY: "year" };
  if (freq === "DAILY" && interval === 1) return { preset: "daily", interval: 1, unit: "day" };
  if (freq === "WEEKLY" && interval === 1) return { preset: "weekly", interval: 1, unit: "week" };
  if (freq === "MONTHLY" && interval === 1) return { preset: "monthly", interval: 1, unit: "month" };
  if (freq === "YEARLY" && interval === 1) return { preset: "yearly", interval: 1, unit: "year" };
  return { preset: "custom", interval, unit: unitMap[freq] ?? "week" };
}

function isRepeatingForm(form: EventFormState) { return form.recurrencePreset !== "one_time"; }

function describeRecurrence(form: EventFormState): string {
  switch (form.recurrencePreset) {
    case "one_time": return "One-time";
    case "daily": return "Daily";
    case "weekly": return "Weekly";
    case "monthly": return "Monthly";
    case "yearly": return "Yearly";
    case "custom": return `Every ${form.recurrenceInterval} ${form.recurrenceUnit}${form.recurrenceInterval !== 1 ? "s" : ""}`;
    default: return "One-time";
  }
}

function expandEventsForRange(events: ProjectEvent[], rangeStart: Date, rangeEnd: Date): EventOccurrence[] {
  const expanded: EventOccurrence[] = [];
  const rsUtc = DateTime.fromJSDate(rangeStart).toUTC();
  const reUtc = DateTime.fromJSDate(rangeEnd).toUTC();

  for (const event of events) {
    const zone = event.timezone || localTimezone;
    if (!event.rrule) {
      expanded.push({ instanceId: `${event.id}-${event.start_at}`, sourceEvent: event, occurrenceStart: event.start_at, occurrenceEnd: event.end_at });
      continue;
    }
    const parsed = parseRRule(event.rrule);
    const interval = Math.max(1, parsed.interval);
    const unit = parsed.unit;
    const baseStart = DateTime.fromISO(event.start_at, { zone: "utc" }).setZone(zone);
    const baseEnd = DateTime.fromISO(event.end_at, { zone: "utc" }).setZone(zone);
    const durMs = baseEnd.toMillis() - baseStart.toMillis();
    let cursor = baseStart;
    let guard = 0;
    while (cursor.toUTC() <= reUtc && guard < 500) {
      const occEnd = DateTime.fromMillis(cursor.toMillis() + durMs, { zone });
      if (occEnd.toUTC() >= rsUtc && cursor.toUTC() <= reUtc) {
        expanded.push({ instanceId: `${event.id}-${cursor.toUTC().toISO()}`, sourceEvent: event, occurrenceStart: cursor.toUTC().toISO()!, occurrenceEnd: occEnd.toUTC().toISO()! });
      }
      cursor = addInterval(cursor, interval, unit);
      guard++;
    }
  }
  return expanded;
}

function addInterval(d: DateTime, n: number, u: RecurrenceUnit) {
  if (u === "day") return d.plus({ days: n });
  if (u === "week") return d.plus({ weeks: n });
  if (u === "month") return d.plus({ months: n });
  return d.plus({ years: n });
}