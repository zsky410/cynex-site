const viDateTime = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const viTimelineDateTime = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const viLongDate = new Intl.DateTimeFormat("vi-VN", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const viTime = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTimeVN(value: string) {
  return viDateTime.format(new Date(value));
}

export function formatLongDateVN(value: string) {
  return viLongDate.format(new Date(value));
}

export function formatTimelineDateTimeVN(value: string) {
  return viTimelineDateTime.format(new Date(value));
}

export function formatWalletTxnTimeVN(value: string, nowInput?: Date) {
  const date = new Date(value);
  const now = nowInput ?? new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (sameDay) {
    return `Hôm nay, ${viTime.format(date)}`;
  }

  return viDateTime.format(date);
}
