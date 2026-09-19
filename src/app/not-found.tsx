import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-2xs font-semibold uppercase tracking-widest text-amber-500">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-foreground">Page not found</h1>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        The business, assessment or page you&rsquo;re looking for doesn&rsquo;t exist in this demonstrator.
      </p>
      <Link href="/" className="mt-4">
        <Button>Back to overview</Button>
      </Link>
    </div>
  );
}
