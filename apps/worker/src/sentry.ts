function formatDsn(dsn?: string) {
  if (!dsn) return "disabled";
  try {
    const url = new URL(dsn);
    return `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    return "configured";
  }
}

export function initWorkerSentry(dsn?: string) {
  if (!dsn) {
    return;
  }
  console.log(`[sentry:worker] initialized (${formatDsn(dsn)})`);
}

export function captureWorkerException(error: unknown) {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`[sentry:worker] captured exception\n${message}`);
}
