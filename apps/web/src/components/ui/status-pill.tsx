import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  pending: "bg-amber-500/12 text-amber-200 ring-1 ring-inset ring-amber-400/20",
  paid: "bg-emerald-500/12 text-emerald-200 ring-1 ring-inset ring-emerald-400/20",
  processing: "bg-sky-500/12 text-sky-200 ring-1 ring-inset ring-sky-400/20",
  delivered: "bg-cyan-500/12 text-cyan-200 ring-1 ring-inset ring-cyan-400/20",
  failed: "bg-rose-500/12 text-rose-200 ring-1 ring-inset ring-rose-400/20",
  cancelled: "bg-slate-400/12 text-slate-300 ring-1 ring-inset ring-slate-400/20",
  refunded: "bg-violet-500/12 text-violet-200 ring-1 ring-inset ring-violet-400/20",
  waiting: "bg-amber-500/12 text-amber-200 ring-1 ring-inset ring-amber-400/20",
  info: "bg-sky-500/12 text-sky-200 ring-1 ring-inset ring-sky-400/20",
  success: "bg-emerald-500/12 text-emerald-200 ring-1 ring-inset ring-emerald-400/20",
  danger: "bg-rose-500/12 text-rose-200 ring-1 ring-inset ring-rose-400/20",
};

export function StatusPill({
  label,
  tone = "info",
  className,
}: {
  label: string;
  tone?: keyof typeof TONE;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        TONE[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
