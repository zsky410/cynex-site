import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductVisual({
  title,
  subtitle,
  accent = "from-cyan-400/30 via-sky-500/10 to-violet-500/25",
  className,
}: {
  title: string;
  subtitle?: string | null;
  accent?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0f1526] p-6",
        className,
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br", accent)} />
      <div className="absolute -left-16 top-8 h-40 w-40 rounded-full bg-cyan-300/12 blur-3xl" />
      <div className="absolute -right-10 bottom-0 h-44 w-44 rounded-full bg-violet-400/12 blur-3xl" />
      <div className="relative flex min-h-56 flex-col justify-between">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
          <Sparkles className="size-3.5 text-cyan-300" />
          Cynex curated access
        </div>
        <div>
          <p className="text-xl font-semibold text-white md:text-2xl">{title}</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-300">
            {subtitle || "Khu vực placeholder visual. Có thể thay bằng artwork hoặc thumbnail thật sau này."}
          </p>
        </div>
      </div>
    </div>
  );
}
