import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const CustomAxisTick = (props: any) => {
    const { x, y, payload } = props;

    if (payload.value.startsWith("Day 0")) {
        return null;
    }

    const [dayPart, datePart] = payload.value.split('|');

    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={16} textAnchor="middle" fill="#666" fontSize={12} fontWeight={500}>
                <tspan x="0" dy="1.2em">{dayPart}</tspan>
                <tspan x="0" dy="1.2em">{datePart}</tspan>
            </text>
        </g>
    );
};

export const BurndownChartUI = ({ data }: { data: any[] }) => (
    <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}
            margin={{ top: 20, right: 30, left: 15, bottom: 35 }}
        >
            <CartesianGrid stroke="aaa" />
            <XAxis dataKey="day"
                tick={<CustomAxisTick />}
                label={{
                    value: "Sprint Day", 
                    position: "insideBottom", 
                    offset: -30
                }} />
            <YAxis width="auto"
                label={{ 
                value: "Remaining Points", 
                position: "insideLeft", 
                angle: -90,
                textAnchor: "middle",
            }} />
            <Tooltip />
            <ReferenceLine
                //x={today}
                stroke="#8016c1"
                strokeDasharray="4 4"
                label={{
                    value: "Today",
                    position: "insideTop",
                    offset: 10,
                    fill: "#8016c1",
                    fontSize: 12,
                    textAnchor: "start",
                    dx: 5,
                }} />
            <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#7C4DFF"
                //stroke="#8E5CF6"
                //stroke="#A855F7"
                strokeWidth={3} 
                connectNulls={false}
                name="Remaining Points" 
            />
            <Line 
                type="monotone" 
                dataKey="ideal" 
                //stroke="#10b981"
                stroke="#94A3B8"
                strokeDasharray="4 4"
                strokeWidth={2}
                dot={false}
                name="Ideal" 
            />
        </LineChart>
    </ResponsiveContainer>
);