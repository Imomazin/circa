import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Card-wrapped prose block with consistent typographic rhythm. */
export function Prose({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 text-sm leading-relaxed text-foreground [&_a]:text-evergreen-600 [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_li]:ml-4 [&_li]:list-disc [&_ol]:flex [&_ol]:flex-col [&_ol]:gap-1.5 [&_ol_li]:list-decimal [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
