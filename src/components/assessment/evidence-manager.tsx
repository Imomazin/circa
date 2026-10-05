"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SelectField, InputField } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { EVIDENCE_TYPES, EVIDENCE_STATUSES } from "@/domain/constants";
import { addEvidenceAction, deleteEvidenceAction } from "@/server/actions";
import type { EvidenceItemRow } from "@/db/schema";

function statusVariant(status: string): React.ComponentProps<typeof Badge>["variant"] {
  return status === "Verified" ? "evergreen" : status === "Provisional" ? "amber" : "outline";
}

interface Draft {
  type: string;
  description: string;
  source: string;
  confidence: number;
  linkedArea: string;
  status: string;
}

const EMPTY_DRAFT: Draft = {
  type: EVIDENCE_TYPES[0],
  description: "",
  source: "",
  confidence: 60,
  linkedArea: "",
  status: "Provisional",
};

/**
 * Interactive evidence management for an assessment: the evidence table plus an
 * inline add form and per-row delete. Every mutation goes through a validated
 * server action, so the evidence confidence score stays honest.
 */
export function EvidenceManager({
  assessmentId,
  items,
}: {
  assessmentId: string;
  items: EvidenceItemRow[];
}) {
  const router = useRouter();
  const [adding, setAdding] = React.useState(false);
  const [draft, setDraft] = React.useState<Draft>(EMPTY_DRAFT);
  const [busy, setBusy] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const valid = draft.description.trim().length > 0 && draft.source.trim().length > 0 && draft.linkedArea.trim().length > 0;

  async function add() {
    if (!valid) return;
    setBusy(true);
    setError(null);
    const res = await addEvidenceAction({ assessmentId, ...draft, description: draft.description.trim(), source: draft.source.trim(), linkedArea: draft.linkedArea.trim() });
    setBusy(false);
    if (res.ok) {
      setDraft(EMPTY_DRAFT);
      setAdding(false);
      router.refresh();
    } else {
      setError(res.message);
    }
  }

  async function remove(evidenceId: string) {
    setPendingDelete(evidenceId);
    setError(null);
    const res = await deleteEvidenceAction({ assessmentId, evidenceId });
    setPendingDelete(null);
    if (res.ok) router.refresh();
    else setError(res.message);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-3 pt-3">
        <p className="text-2xs text-muted-foreground">
          {items.length} item{items.length === 1 ? "" : "s"} · changes recompute Evidence Confidence
        </p>
        {!adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Add evidence
          </Button>
        )}
      </div>

      {adding && (
        <div className="mx-3 rounded-md border border-border bg-charcoal-50/60 p-3 dark:bg-charcoal-800/40">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium text-foreground">New evidence item</p>
            <button
              onClick={() => {
                setAdding(false);
                setDraft(EMPTY_DRAFT);
                setError(null);
              }}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
            <SelectField
              label="Type"
              value={draft.type}
              onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))}
              options={EVIDENCE_TYPES.map((t) => ({ value: t, label: t }))}
            />
            <SelectField
              label="Status"
              value={draft.status}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
              options={EVIDENCE_STATUSES.map((s) => ({ value: s, label: s }))}
            />
            <InputField
              label="Linked area"
              placeholder="e.g. Customer demand"
              value={draft.linkedArea}
              onChange={(e) => setDraft((d) => ({ ...d, linkedArea: e.target.value }))}
            />
            <InputField
              label="Confidence (0–100)"
              type="number"
              min={0}
              max={100}
              value={draft.confidence}
              onChange={(e) => setDraft((d) => ({ ...d, confidence: Number(e.target.value) }))}
            />
            <div className="sm:col-span-2">
              <InputField
                label="Source"
                placeholder="e.g. Pilot report, Q2 2026"
                value={draft.source}
                onChange={(e) => setDraft((d) => ({ ...d, source: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Description</label>
              <textarea
                rows={2}
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <Button size="sm" onClick={add} disabled={busy || !valid}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add item
            </Button>
          </div>
        </div>
      )}

      {error && <p className="px-3 text-xs text-red-600">{error}</p>}

      {items.length === 0 ? (
        <p className="px-3 pb-3 text-xs text-muted-foreground">No evidence recorded yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Linked area</TableHead>
              <TableHead className="text-right">Confidence</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="whitespace-nowrap font-medium text-foreground">{e.type}</TableCell>
                <TableCell className="text-muted-foreground">{e.description}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{e.linkedArea}</TableCell>
                <TableCell className="text-right tabular-nums">{e.confidence}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(e.status)}>{e.status}</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-2xs text-muted-foreground">
                  {formatDate(e.dateRecorded)}
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => remove(e.id)}
                    disabled={pendingDelete === e.id}
                    className="text-muted-foreground transition-colors hover:text-red-600 disabled:opacity-50"
                    aria-label={`Remove ${e.type} evidence`}
                  >
                    {pendingDelete === e.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
