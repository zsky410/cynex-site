import { cn } from "@/lib/utils";

export function CynexLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline pb-[0.08em] leading-[1.12] font-['Rajdhani','Orbitron','Space_Grotesk',sans-serif] font-bold tracking-[-0.04em] text-transparent bg-[linear-gradient(105deg,#0369a1_0%,#0ea5e9_42%,#2563eb_100%)] bg-clip-text",
        className,
      )}
    >
      Cynex
    </span>
  );
}
