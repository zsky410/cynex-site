import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Panel } from "@/components/ui/panel";

export function EmptyState({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href?: string;
  cta?: string;
}) {
  return (
    <Panel className="flex min-h-52 flex-col items-start justify-center gap-3">
      <p className="eyebrow">Empty</p>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="max-w-md text-sm leading-6 text-slate-300">{description}</p>
      {href && cta ? (
        <Link href={href} className="button-secondary mt-2">
          {cta}
          <ArrowRight className="size-4" />
        </Link>
      ) : null}
    </Panel>
  );
}
