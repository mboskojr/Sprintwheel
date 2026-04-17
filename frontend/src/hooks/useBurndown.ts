import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

interface Sprint {
  id: string;
  sprint_number: number;
  sprint_name?: string;
  start_date: string;
  end_date: string;
  is_active?: boolean;
}

interface Story {
  id: string;
  sprint_id: string | null;
  title: string;
  points: number | null;
  isDone: boolean;
  date_added: string | null;
  date_completed: string | null;
}

export interface BurndownPoint {
  day: string;
  actual: number | null;
  ideal: number;
  isoDate: string;
}

function parseYMDToLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toLocalISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatAxisLabel(dayIndex: number, date: Date): string {
  const pretty = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return `Day ${dayIndex}|${pretty}`;
}

function sumPoints(stories: Story[]): number {
  return stories.reduce((sum, story) => sum + (story.points ?? 0), 0);
}

function diffInDays(start: Date, end: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const startOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.floor((endOnly.getTime() - startOnly.getTime()) / msPerDay);
}

export function useSprintBurndownData(projectId: string, sprintId: string) {
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!projectId || !sprintId) {
      setSprint(null);
      setStories([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [sprintsRes, storiesRes] = await Promise.all([
          api<Sprint[]>(`/sprints?project_id=${projectId}`),
          api<Story[]>(`/stories?project_id=${projectId}`),
        ]);

        if (cancelled) return;

        const allSprints = Array.isArray(sprintsRes) ? sprintsRes : [];
        const allStories = Array.isArray(storiesRes) ? storiesRes : [];

        const selectedSprint = allSprints.find((s) => s.id === sprintId) ?? null;
        const sprintStories = allStories.filter((story) => story.sprint_id === sprintId);

        setSprint(selectedSprint);
        setStories(sprintStories);
      } catch (err) {
        console.error("Error loading burndown data:", err);
        if (!cancelled) {
          setSprint(null);
          setStories([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [projectId, sprintId]);

  const chartData = useMemo<BurndownPoint[]>(() => {
    if (!sprint?.start_date || !sprint?.end_date) return [];

    const sprintStart = parseYMDToLocalDate(sprint.start_date);
    const sprintEnd = parseYMDToLocalDate(sprint.end_date);

    if (sprintEnd < sprintStart) return [];

    const totalPoints = sumPoints(stories);
    const sprintLengthDays = diffInDays(sprintStart, sprintEnd) + 1; // inclusive
    const today = new Date();
    const todayIso = toLocalISODate(today);

    const isCurrentSprint =
      todayIso >= sprint.start_date && todayIso <= sprint.end_date;

    const isFutureSprint = todayIso < sprint.start_date;

    const totalPointsInSeries = sprintLengthDays + 1;

    const pointsRemainingThroughDate = (isoDate: string) => {
      return stories.reduce((sum, story) => {
        const pts = story.points ?? 0;
        const addedDate = story.date_added || sprint.start_date;
        const completedDate = story.date_completed;

        // story not yet in sprint scope on that day
        if (addedDate > isoDate) return sum;

        // old logic look: drop after that day's work is applied
        if (completedDate && completedDate <= isoDate) return sum;

        return sum + pts;
      }, 0);
    };

    let lastActualIndex = totalPointsInSeries - 1;

    if (isFutureSprint) {
      lastActualIndex = 0;
    } else if (isCurrentSprint) {
      const elapsedSprintDays = diffInDays(sprintStart, today) + 1;
      lastActualIndex = Math.min(Math.max(elapsedSprintDays, 0), sprintLengthDays);
    }

    const data: BurndownPoint[] = [];

    for (let index = 0; index < totalPointsInSeries; index++) {
      const chartDate =
        index === 0
          ? new Date(sprintStart)
          : new Date(
              sprintStart.getFullYear(),
              sprintStart.getMonth(),
              sprintStart.getDate() + (index - 1)
            );

      const isoDate = toLocalISODate(chartDate);

      let actual: number | null;

      if (index > lastActualIndex) {
        actual = null;
      } else if (index === 0) {
        actual = totalPoints;
      } else {
        actual = pointsRemainingThroughDate(isoDate);
      }

      const ideal =
        totalPointsInSeries > 1
          ? Math.max(
              0,
              totalPoints - index * (totalPoints / (totalPointsInSeries - 1))
            )
          : totalPoints;

      data.push({
        day: formatAxisLabel(index, chartDate),
        isoDate,
        actual,
        ideal: Number(ideal.toFixed(1)),
      });
    }

    return data;
  }, [sprint, stories]);

  const velocity = useMemo(() => {
    return stories
      .filter((story) => Boolean(story.date_completed))
      .reduce((sum, story) => sum + (story.points ?? 0), 0);
  }, [stories]);

  const expectedVelocity = useMemo(() => {
    return stories.reduce((sum, story) => sum + (story.points ?? 0), 0);
  }, [stories]);

  return {
    chartData,
    sprintNumber: sprint?.sprint_number ?? "—",
    velocity,
    expectedVelocity,
    loading,
  };
}