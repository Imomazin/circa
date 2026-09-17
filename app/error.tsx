"use client";
import Link from "next/link";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="pad">
      <h1>We could not load this view</h1>
      <p className="muted" style={{ margin: "14px 0" }}>
        Your saved work is retained. Retry the request or return to your
        workspace.
      </p>
      <button className="btn primary" onClick={reset}>
        Try again
      </button>
      <Link className="btn" href="/">
        Open workspace
      </Link>
    </main>
  );
}
