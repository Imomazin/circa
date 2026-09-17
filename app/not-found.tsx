import Link from "next/link";
export default function NotFound() {
  return (
    <main className="pad">
      <h1>Record not found</h1>
      <p className="muted" style={{ margin: "16px 0" }}>
        This record is unavailable in your current demonstration workspace.
      </p>
      <Link href="/overview" className="btn primary">
        Return to overview
      </Link>
    </main>
  );
}
