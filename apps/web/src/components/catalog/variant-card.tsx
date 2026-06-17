import { Clock3, ShieldCheck, Sparkles } from "lucide-react";
import { cn, formatVnd } from "@/lib/utils";

export function VariantCard({
  title,
  subtitle,
  price,
  warrantyDays,
  estimatedDeliveryMinutes,
  selected,
  disabled,
  onSelect,
}: {
  title: string;
  subtitle: string;
  price: number;
  warrantyDays: number;
  estimatedDeliveryMinutes?: number | null;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "w-full rounded-[24px] border p-4 text-left transition md:p-5",
        selected
          ? "border-cyan-400/40 bg-cyan-400/10"
          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
            <Sparkles className="size-3.5 text-violet-300" />
            Gói bán
          </div>
          <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{subtitle}</p>
        </div>
        <p className="shrink-0 text-lg font-semibold text-cyan-300">{formatVnd(price)}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5">
          <ShieldCheck className="size-3.5 text-emerald-300" />
          BH {warrantyDays} ngày
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5">
          <Clock3 className="size-3.5 text-cyan-300" />
          {estimatedDeliveryMinutes ? `Xử lý ~${estimatedDeliveryMinutes} phút` : "Admin xử lý thủ công"}
        </span>
      </div>
    </button>
  );
}
