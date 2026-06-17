function formatDsn(dsn?: string) {
  if (!dsn) return "disabled";
  try {
    const url = new URL(dsn);
    return `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    return "configured";
  }
}

export function initApiSentry(dsn?: string) {
  if (!dsn) {
    return;
  }
  console.log(`[sentry:api] initialized (${formatDsn(dsn)})`);
}

export function captureApiException(error: unknown) {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`[sentry:api] captured exception\n${message}`);
}
