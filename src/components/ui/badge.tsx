import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[.06] px-3 py-1 font-mono text-[10px] uppercase tracking-[.18em] text-primary", className)} {...props} />;
}
