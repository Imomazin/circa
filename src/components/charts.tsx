"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ZAxis,
  Legend,
  LabelList,
} from "recharts";

/**
 * Circa chart components.
 *
 * A small categorical palette drawn from the Circa design language. Charts are
 * labelled and use restrained colour so they read as commercial-intelligence
 * visuals, not decoration.
 */
export const PALETTE = {
  evergreen: "#1a594a",
  evergreenLight: "#3f8d78",
  amber: "#c98a2b",
  charcoal: "#4d555d",
  grey: "#a49d90",
  red: "#b4472f",
};

export const CATEGORICAL = [
  "#1a594a",
  "#3f8d78",
  "#c98a2b",
  "#6f6b65",
  "#26705d",
  "#dcaa53",
  "#a4abb2",
  "#14473c",
  "#85561a",
  "#727b84",
];

const axisStyle = { fontSize: 11, fill: "currentColor" } as const;

function CircaTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs shadow-md">
      {label !== undefined && <p className="mb-1 font-medium text-foreground">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-1.5 text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-sm" style={{ background: p.color || p.fill }} />
          <span className="text-foreground">{p.name}:</span>
          <span className="font-medium tabular-nums text-foreground">
            {typeof p.value === "number" ? p.value.toLocaleString("en-GB") : p.value}
            {unit ?? ""}
          </span>
        </p>
      ))}
    </div>
  );
}

export interface NamedValue {
  name: string;
  value: number;
}

/** Horizontal bar chart, good for ranked categories. */
export function HorizontalBars({
  data,
  height = 260,
  unit,
  color = PALETTE.evergreen,
  domain,
}: {
  data: NamedValue[];
  height?: number;
  unit?: string;
  color?: string;
  domain?: [number, number];
}) {
  return (
    <div className="text-charcoal-500 dark:text-charcoal-300" style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
          <CartesianGrid horizontal={false} stroke="currentColor" strokeOpacity={0.12} />
          <XAxis type="number" tick={axisStyle} domain={domain} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={axisStyle}
            width={140}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CircaTooltip unit={unit} />} cursor={{ fill: "currentColor", fillOpacity: 0.05 }} />
          <Bar dataKey="value" name="Value" radius={[0, 4, 4, 0]} fill={color}>
            <LabelList dataKey="value" position="right" style={{ fontSize: 11, fill: "currentColor" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Vertical bar chart with per-bar colour by value band. */
export function ScoreBars({
  data,
  height = 260,
  colorByValue = true,
}: {
  data: NamedValue[];
  height?: number;
  colorByValue?: boolean;
}) {
  const color = (v: number) =>
    v >= 65 ? PALETTE.evergreen : v >= 50 ? PALETTE.evergreenLight : v >= 35 ? PALETTE.amber : PALETTE.red;
  return (
    <div className="text-charcoal-500 dark:text-charcoal-300" style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: -12, right: 8, top: 8, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.12} />
          <XAxis dataKey="name" tick={axisStyle} interval={0} tickLine={false} axisLine={false} angle={0} />
          <YAxis tick={axisStyle} domain={[0, 100]} tickLine={false} axisLine={false} />
          <Tooltip content={<CircaTooltip />} cursor={{ fill: "currentColor", fillOpacity: 0.05 }} />
          <Bar dataKey="value" name="Score" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={colorByValue ? color(d.value) : PALETTE.evergreen} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Donut / distribution chart. */
export function DonutChart({
  data,
  height = 240,
  unit,
}: {
  data: NamedValue[];
  height?: number;
  unit?: string;
}) {
  return (
    <div className="text-charcoal-500 dark:text-charcoal-300" style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="55%"
            outerRadius="82%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CATEGORICAL[i % CATEGORICAL.length]} />
            ))}
          </Pie>
          <Tooltip content={<CircaTooltip unit={unit} />} />
          <Legend
            verticalAlign="middle"
            align="right"
            layout="vertical"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Radar chart for a single entity's component scores. */
export function RadarScores({
  data,
  height = 300,
}: {
  data: { axis: string; value: number }[];
  height?: number;
}) {
  return (
    <div className="text-charcoal-400 dark:text-charcoal-300" style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="currentColor" strokeOpacity={0.2} />
          <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: "currentColor" }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "currentColor" }} angle={90} />
          <Radar
            name="Score"
            dataKey="value"
            stroke={PALETTE.evergreen}
            fill={PALETTE.evergreenLight}
            fillOpacity={0.35}
          />
          <Tooltip content={<CircaTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface ScatterPoint {
  x: number;
  y: number;
  z?: number;
  name: string;
}

/** Scatter for viability vs evidence (or any two dimensions). */
export function ScatterPlot({
  data,
  xLabel,
  yLabel,
  height = 320,
  refX,
  refY,
}: {
  data: ScatterPoint[];
  xLabel: string;
  yLabel: string;
  height?: number;
  refX?: number;
  refY?: number;
}) {
  return (
    <div className="text-charcoal-500 dark:text-charcoal-300" style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <ScatterChart margin={{ left: 4, right: 16, top: 12, bottom: 20 }}>
          <CartesianGrid stroke="currentColor" strokeOpacity={0.12} />
          <XAxis
            type="number"
            dataKey="x"
            name={xLabel}
            domain={[0, 100]}
            tick={axisStyle}
            tickLine={false}
            label={{ value: xLabel, position: "insideBottom", offset: -10, fontSize: 11, fill: "currentColor" }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yLabel}
            domain={[0, 100]}
            tick={axisStyle}
            tickLine={false}
            label={{ value: yLabel, angle: -90, position: "insideLeft", fontSize: 11, fill: "currentColor" }}
          />
          <ZAxis type="number" dataKey="z" range={[60, 400]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }: any) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as ScatterPoint;
              return (
                <div className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs shadow-md">
                  <p className="font-medium text-foreground">{p.name}</p>
                  <p className="text-muted-foreground">
                    {xLabel}: <span className="text-foreground">{p.x}</span>
                  </p>
                  <p className="text-muted-foreground">
                    {yLabel}: <span className="text-foreground">{p.y}</span>
                  </p>
                </div>
              );
            }}
          />
          <Scatter data={data} fill={PALETTE.evergreen} fillOpacity={0.75} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Grouped bars comparing scenarios on a chosen metric. */
export function ScenarioComparison({
  data,
  height = 280,
  unit,
}: {
  data: { name: string; value: number }[];
  height?: number;
  unit?: string;
}) {
  const colors = [PALETTE.charcoal, PALETTE.evergreen, PALETTE.evergreenLight, PALETTE.amber];
  return (
    <div className="text-charcoal-500 dark:text-charcoal-300" style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: 4, right: 8, top: 12, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.12} />
          <XAxis dataKey="name" tick={axisStyle} tickLine={false} axisLine={false} interval={0} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={72} />
          <Tooltip content={<CircaTooltip unit={unit} />} cursor={{ fill: "currentColor", fillOpacity: 0.05 }} />
          <Bar dataKey="value" name="Value" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              style={{ fontSize: 10, fill: "currentColor" }}
              formatter={(v: number) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : v)}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
