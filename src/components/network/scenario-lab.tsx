"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { formatGBP, formatGBPCompact, formatCarbon } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ScenarioBase {
  volumeTonnes: number;
  pricePerTonne: number;
  disposalPerTonne: number;
  processingPerTonne: number;
  distanceKm: number;
  freightPerTonneKm: number;
  carbonPerTonne: number;
  freightCarbonPerTonneKm: number;
  implementationCost: number;
}

interface Params {
  quantity: number;
  price: number;
  disposal: number;
  processing: number;
  distance: number;
  freightRate: number;
  implementation: number;
  carbonFactor: number;
  takeUp: number;
  yield: number;
}

type PresetName = "Base" | "Conservative" | "Target" | "Accelerated";

function baseParams(b: ScenarioBase): Params {
  return {
    quantity: b.volumeTonnes,
    price: b.pricePerTonne,
    disposal: b.disposalPerTonne,
    processing: b.processingPerTonne,
    distance: b.distanceKm,
    freightRate: b.freightPerTonneKm,
    implementation: b.implementationCost,
    carbonFactor: 1,
    takeUp: 90,
    yield: 92,
  };
}

function applyPreset(b: ScenarioBase, name: PresetName): Params {
  const p = baseParams(b);
  switch (name) {
    case "Conservative":
      return { ...p, quantity: Math.round(b.volumeTonnes * 0.7), price: Math.round(b.pricePerTonne * 0.9), freightRate: round2(b.freightPerTonneKm * 1.15), takeUp: 70, yield: 85 };
    case "Target":
      return { ...p, takeUp: 90, yield: 92 };
    case "Accelerated":
      return { ...p, quantity: Math.round(b.volumeTonnes * 1.25), price: Math.round(b.pricePerTonne * 1.08), disposal: Math.round(b.disposalPerTonne * 1.05), takeUp: 100, yield: 95 };
    default:
      return p;
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function compute(b: ScenarioBase, p: Params) {
  const effVol = p.quantity * (p.takeUp / 100) * (p.yield / 100);
  const gross = effVol * p.price;
  const avoided = effVol * p.disposal;
  const transport = p.distance * effVol * p.freightRate;
  const processing = effVol * p.processing;
  const net = gross + avoided - transport - processing;
  const carbonGross = effVol * b.carbonPerTonne * p.carbonFactor;
  const transportCarbon = p.distance * effVol * b.freightCarbonPerTonneKm;
  const carbon = Math.max(0, carbonGross - transportCarbon);
  const payback = net > 0 ? p.implementation / net : null;
  return { effVol, gross, avoided, transport, processing, net, carbon, payback };
}

const SLIDERS: {
  key: keyof Params;
  label: string;
  min: (b: ScenarioBase) => number;
  max: (b: ScenarioBase) => number;
  step: number;
  fmt: (v: number) => string;
}[] = [
  { key: "quantity", label: "Quantity (t/yr)", min: (b) => Math.round(b.volumeTonnes * 0.3), max: (b) => Math.round(b.volumeTonnes * 1.8), step: 1, fmt: (v) => `${Math.round(v)} t` },
  { key: "price", label: "Material price (£/t)", min: (b) => Math.round(b.pricePerTonne * 0.5), max: (b) => Math.round(b.pricePerTonne * 1.6), step: 5, fmt: (v) => `£${Math.round(v)}` },
  { key: "disposal", label: "Disposal fee avoided (£/t)", min: () => 0, max: (b) => Math.round(b.disposalPerTonne * 2), step: 5, fmt: (v) => `£${Math.round(v)}` },
  { key: "freightRate", label: "Transport rate (£/t·km)", min: () => 0.04, max: () => 0.28, step: 0.01, fmt: (v) => `£${v.toFixed(2)}` },
  { key: "distance", label: "Distance (km)", min: () => 10, max: (b) => Math.max(400, Math.round(b.distanceKm * 1.6)), step: 5, fmt: (v) => `${Math.round(v)} km` },
  { key: "processing", label: "Processing cost (£/t)", min: () => 0, max: (b) => Math.round(b.processingPerTonne * 2), step: 5, fmt: (v) => `£${Math.round(v)}` },
  { key: "implementation", label: "Implementation (£)", min: () => 0, max: (b) => Math.round(b.implementationCost * 2.5), step: 1000, fmt: (v) => formatGBPCompact(v) },
  { key: "carbonFactor", label: "Carbon factor (×)", min: () => 0.5, max: () => 1.5, step: 0.05, fmt: (v) => `${v.toFixed(2)}×` },
  { key: "takeUp", label: "Take-up (%)", min: () => 20, max: () => 100, step: 1, fmt: (v) => `${Math.round(v)}%` },
  { key: "yield", label: "Conversion yield (%)", min: () => 50, max: () => 100, step: 1, fmt: (v) => `${Math.round(v)}%` },
];

/** Drivers to flex ±15% for the tornado. */
const TORNADO: (keyof Params)[] = ["quantity", "price", "disposal", "freightRate", "distance", "processing", "takeUp", "yield"];
const TORNADO_LABEL: Record<string, string> = {
  quantity: "Quantity",
  price: "Material price",
  disposal: "Disposal fee",
  freightRate: "Transport rate",
  distance: "Distance",
  processing: "Processing",
  takeUp: "Take-up",
  yield: "Yield",
};

export function ScenarioLab({ base }: { base: ScenarioBase }) {
  const [preset, setPreset] = React.useState<PresetName | "Custom">("Target");
  const [params, setParams] = React.useState<Params>(() => applyPreset(base, "Target"));

  const result = compute(base, params);
  const baseNet = compute(base, applyPreset(base, "Target")).net;

  function choose(name: PresetName) {
    setPreset(name);
    setParams(applyPreset(base, name));
  }
  function update(key: keyof Params, value: number) {
    setPreset("Custom");
    setParams((p) => ({ ...p, [key]: value }));
  }

  // Tornado: ±15% each driver, Δ net value vs current.
  const tornado = TORNADO.map((key) => {
    const up = compute(base, { ...params, [key]: (params[key] as number) * 1.15 }).net - result.net;
    const down = compute(base, { ...params, [key]: (params[key] as number) * 0.85 }).net - result.net;
    return { key, up, down, span: Math.abs(up) + Math.abs(down) };
  }).sort((a, b) => b.span - a.span);
  const maxSpan = Math.max(...tornado.map((t) => Math.max(Math.abs(t.up), Math.abs(t.down))), 1);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      {/* Controls */}
      <div className="rounded-lg border border-border bg-card p-5 shadow-card">
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          {(["Base", "Conservative", "Target", "Accelerated"] as PresetName[]).map((n) => (
            <button
              key={n}
              onClick={() => choose(n)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                preset === n ? "bg-evergreen-700 text-white" : "border border-border text-muted-foreground hover:bg-surface",
              )}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => choose("Target")}
            className="ml-auto inline-flex items-center gap-1 text-2xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-3.5 sm:grid-cols-2">
          {SLIDERS.map((s) => {
            const min = s.min(base);
            const max = s.max(base);
            const val = params[s.key] as number;
            return (
              <div key={s.key}>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-2xs font-medium text-foreground">{s.label}</label>
                  <span className="text-2xs font-semibold tabular-nums text-evergreen-600">{s.fmt(val)}</span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={s.step}
                  value={val}
                  onChange={(e) => update(s.key, Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-2 accent-evergreen-700"
                  aria-label={s.label}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-border bg-card p-5 shadow-card">
          <p className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Net annual value</p>
          <p className={cn("font-serif text-[2rem] font-semibold leading-none tabular-nums", result.net >= 0 ? "text-evergreen-700 dark:text-evergreen-300" : "text-red-600")}>
            {formatGBP(Math.round(result.net))}
          </p>
          <p className={cn("mt-1 text-2xs tabular-nums", result.net >= baseNet ? "text-evergreen-600" : "text-copper-600")}>
            {result.net >= baseNet ? "▲" : "▼"} {formatGBPCompact(Math.abs(result.net - baseNet))} vs target case
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-2xs">
            <Fig label="Gross value" v={formatGBPCompact(result.gross)} />
            <Fig label="Avoided disposal" v={formatGBPCompact(result.avoided)} />
            <Fig label="Transport" v={`−${formatGBPCompact(result.transport)}`} />
            <Fig label="Processing" v={`−${formatGBPCompact(result.processing)}`} />
            <Fig label="Carbon / yr" v={formatCarbon(result.carbon)} />
            <Fig label="Payback" v={result.payback ? `${result.payback.toFixed(1)} yr` : "—"} />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-card">
          <p className="mb-3 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Sensitivity (±15%)</p>
          <div className="flex flex-col gap-1.5">
            {tornado.map((t) => (
              <div key={t.key} className="flex items-center gap-2">
                <span className="w-20 shrink-0 text-2xs text-muted-foreground">{TORNADO_LABEL[t.key]}</span>
                <div className="relative h-3.5 flex-1">
                  <span className="absolute left-1/2 top-0 h-full w-px bg-border-strong" />
                  <span
                    className="absolute top-0 h-full rounded-sm bg-copper-400/80"
                    style={{ right: "50%", width: `${(Math.abs(Math.min(t.up, t.down)) / maxSpan) * 50}%` }}
                  />
                  <span
                    className="absolute top-0 h-full rounded-sm bg-evergreen-600/80"
                    style={{ left: "50%", width: `${(Math.abs(Math.max(t.up, t.down)) / maxSpan) * 50}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-2xs text-muted-foreground">Green = net value rises, copper = falls.</p>
        </div>
      </div>
    </div>
  );
}

function Fig({ label, v }: { label: string; v: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold tabular-nums text-foreground">{v}</p>
    </div>
  );
}
