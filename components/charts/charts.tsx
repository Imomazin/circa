"use client";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Legend,
} from "recharts";
export function ComparisonChart({
  data,
}: {
  data: { name: string; viability: number; readiness: number }[];
}) {
  return (
    <div
      className="chart"
      role="img"
      aria-label="Commercial viability and investor readiness by sector, scores out of 100"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 12, right: 15, left: -15, bottom: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e4e8df"
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "#64726c" }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #dce2db",
              fontSize: 12,
            }}
          />
          <Legend
            iconType="square"
            iconSize={8}
            wrapperStyle={{ fontSize: 10, paddingTop: 14 }}
          />
          <Bar
            name="Commercial viability"
            dataKey="viability"
            fill="#315c46"
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            name="Investor readiness"
            dataKey="readiness"
            fill="#bacbb0"
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function CashflowChart({
  data,
}: {
  data: {
    year: string;
    baseline: number;
    circular: number;
    incremental: number;
  }[];
}) {
  return (
    <div
      className="chart"
      role="img"
      aria-label="Cumulative cash contribution in pounds over three years, baseline compared with circular scenario"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `£${Math.round(v / 1000)}k`}
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(v) => `£${Number(v).toLocaleString("en-GB")}`}
            contentStyle={{ borderRadius: 8, fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line
            name="Current baseline"
            type="monotone"
            dataKey="baseline"
            stroke="#a4afa4"
            strokeWidth={2}
            strokeDasharray="5 4"
          />
          <Line
            name="Circular scenario"
            type="monotone"
            dataKey="circular"
            stroke="#315c46"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
