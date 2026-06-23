export function resolvePostAuthRedirect(
  next: string | null | undefined,
  fallback: string,
): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;
  return next;
}

export function buildAuthHref(pathname: string, next: string | null | undefined): string {
  const safeNext = resolvePostAuthRedirect(next, "");
  if (!safeNext) return pathname;
  const params = new URLSearchParams({ next: safeNext });
  return `${pathname}?${params.toString()}`;
}
