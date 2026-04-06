import { useState, useEffect } from "react";
import { API_BASE } from "../api/base";

export const useSprintBurndownData = (sprintId: string) => {
    const [chartData, setChartData] = useState<any[]>([]);
    const [sprintNumber, setSprintNumber] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sprintId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

                const metRes = await fetch(`${API_BASE}/sprints/${sprintId}`, { headers });
                const metData = await metRes.json();
                setSprintNumber(metData.sprint_number);

                const burnRes = await fetch(`${API_BASE}/sprints/${sprintId}/burndown`, { headers });
                const data = await burnRes.json();
                const burndown_array = data.burndown_array;

                if (burndown_array) {
                    const totalPoints = burndown_array || 0;
                    const duration = burndown_array.length;

                    const formatted = burndown_array.map((actual: number | null, index: number) => ({
                        day: `Day ${index}`,
                        actual: actual,
                        ideal: Math.max(0, totalPoints - (index * (totalPoints / (duration - 1))))
                    }));
                    setChartData(formatted);
                }
            } catch (error) {
                console.error("Fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [sprintId]);

    return { chartData, sprintNumber, loading };
};