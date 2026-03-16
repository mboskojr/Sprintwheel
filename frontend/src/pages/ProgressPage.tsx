import type{ CSSProperties, JSX } from "react";
//import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import SprintBurndownChart from "../components/SprintBurndownChart";

export default function ProgressPage(): JSX.Element {

    const containerStyle: CSSProperties = { color: "black", padding: 40 };

    // data to hold space for test graph
    {/*const testData = [
        { date: "Day 1", remaining: 0, ideal: 0 },
        { date: "Day 2", remaining: 0, ideal: 0 },
        { date: "Day 3", remaining: 0, ideal: 0 },
    ];
    */}


    return (
        <div style={containerStyle}>
            <h1>Progress Page</h1>
            <p>This is the Progress page.</p>
            <p> This is where the Burndown Chart, Velocity Chart, & Sprint Report will live</p>

            <img src="/sprint_burndown_chart.png" alt="Sprint Burndown Chart showing task completion over time" style={{ maxWidth: "100%", height: "auto", marginTop: 20 }} />

            <h2>Sprint #BLANK Burndown Chart</h2>
            <div style={{ padding: 40 }}>
                <SprintBurndownChart />
            </div>


            {/* Placeholder Recharts graph*/}
            {/*
            <div style={{ marginTop: 20}}>
                <LineChart
                width={800}
                height={350}
                data={testData}
                margin={{ top: 20, right: 30, left: 5, bottom: 10 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="remaining" stroke="#ff4d4f" strokeWidth={2} name="Remaining Points" />
                    <Line type="monotone" dataKey="ideal" stroke="#8884d8" strokeDasharray="5 5" name="Ideal" />
                </LineChart>
            </div>
            */}


        </div>
    );
}
