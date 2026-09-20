"use client";

import * as React from "react";
import { useActionState } from "react";
import { RotateCcw, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resetDemoAction, type ActionResult } from "@/server/actions";

const initial: ActionResult = { ok: false, message: "" };

/**
 * Guarded "Reset demo data" control. The user must type RESET and confirm,
 * then the server action restores the deterministic seed.
 */
export function ResetDemo() {
  const [state, action, pending] = useActionState(resetDemoAction, initial);
  const [confirmValue, setConfirmValue] = React.useState("");

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          This clears all current data and restores the deterministic demonstrator seed (12 businesses).
          Any edited scenarios or assessments will be lost. Type <strong>RESET</strong> to confirm.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          name="confirm"
          value={confirmValue}
          onChange={(e) => setConfirmValue(e.target.value)}
          placeholder="Type RESET"
          aria-label="Type RESET to confirm"
          className="h-9 w-40 rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit" variant="danger" disabled={pending || confirmValue !== "RESET"}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
          Reset demo data
        </Button>
        {state.message && (
          <span className={`text-xs ${state.ok ? "text-evergreen-600" : "text-red-500"}`}>{state.message}</span>
        )}
      </div>
    </form>
  );
}
