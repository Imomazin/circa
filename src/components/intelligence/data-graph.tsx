import * as React from "react";
import type { GraphEdge, GraphNode } from "@/integrations/types";

/**
 * Commercial Data Graph — how CIRCA turns connected enterprise data into
 * commercially actionable circular opportunities. Pure inline SVG, legible in
 * both themes; columns flow ERP → supply → CIRCA → identity/context → match
 * engine + procurement → opportunity → carbon/logistics → net value → action.
 */
const COL_W = 150;
const ROW_H = 92;
const NODE_W = 128;
const NODE_H = 56;
const PAD_X = 12;
const PAD_Y = 16;

function nodeXY(n: GraphNode) {
  const x = PAD_X + n.col * COL_W;
  const y = PAD_Y + n.row * ROW_H;
  return { x, y, cx: x + NODE_W / 2, cy: y + NODE_H / 2 };
}

const KIND_CLASS: Record<GraphNode["kind"], string> = {
  source: "fill-card stroke-border-strong",
  core: "fill-evergreen-700 stroke-evergreen-700",
  engine: "fill-copper-500 stroke-copper-500",
  output: "fill-graphite-800 stroke-graphite-800",
};
const KIND_TEXT: Record<GraphNode["kind"], string> = {
  source: "fill-foreground",
  core: "fill-white",
  engine: "fill-white",
  output: "fill-white",
};

export function DataGraph({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const maxCol = Math.max(...nodes.map((n) => n.col));
  const maxRow = Math.max(...nodes.map((n) => n.row));
  const W = PAD_X * 2 + maxCol * COL_W + NODE_W;
  const H = PAD_Y * 2 + maxRow * ROW_H + NODE_H;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[920px]" role="img" aria-label="CIRCA commercial data graph">
        {edges.map((e, i) => {
          const a = byId.get(e.from);
          const b = byId.get(e.to);
          if (!a || !b) return null;
          const pa = nodeXY(a);
          const pb = nodeXY(b);
          const x1 = pa.x + NODE_W;
          const y1 = pa.cy;
          const x2 = pb.x;
          const y2 = pb.cy;
          const mx = (x1 + x2) / 2;
          return (
            <path
              key={i}
              d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
              fill="none"
              className="stroke-border-strong"
              strokeWidth={1.5}
            />
          );
        })}
        {nodes.map((n) => {
          const p = nodeXY(n);
          return (
            <g key={n.id}>
              <rect
                x={p.x}
                y={p.y}
                width={NODE_W}
                height={NODE_H}
                rx={7}
                className={KIND_CLASS[n.kind]}
                strokeWidth={1.5}
              />
              <text
                x={p.cx}
                y={n.sublabel ? p.cy - 2 : p.cy + 4}
                textAnchor="middle"
                className={`${KIND_TEXT[n.kind]} text-[10.5px] font-semibold`}
              >
                {n.label.length > 20 ? n.label.slice(0, 19) + "…" : n.label}
              </text>
              {n.sublabel && (
                <text
                  x={p.cx}
                  y={p.cy + 11}
                  textAnchor="middle"
                  className={`${KIND_TEXT[n.kind]} text-[8.5px]`}
                  opacity={0.8}
                >
                  {n.sublabel}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
