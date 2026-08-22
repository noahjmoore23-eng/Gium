export function currency(amount: number): string {
  return amount.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

export function currencyExact(amount: number): string {
  return amount.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export function hours(value: number): string {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} hrs`;
}

export function integer(value: number): string {
  return Math.round(value).toLocaleString();
}

export function percent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

/** "Mon" / "14" pieces for the dispatch board's day headers. */
export function dayParts(isoDate: string): { weekday: string; day: string; month: string } {
  const date = new Date(`${isoDate}T00:00:00`);
  return {
    weekday: date.toLocaleDateString(undefined, { weekday: 'short' }),
    day: String(date.getDate()),
    month: date.toLocaleDateString(undefined, { month: 'short' }),
  };
}

export function todayIso(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

/** End time for a job that starts at HH:MM and runs for the given hours. */
export function endTime(start: string, durationHours: number): string {
  const [h, m] = start.split(':').map(Number);
  const total = (h || 0) * 60 + (m || 0) + Math.round(durationHours * 60);
  const clamped = Math.min(total, 24 * 60 - 1);
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`;
}
