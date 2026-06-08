import type { Shift } from '@/types/api';

export const DAY_START_HOUR = 0;
export const DAY_END_HOUR   = 24;

/** Minutes since midnight from a "HH:MM" or "HH:MM:SS" string. */
export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m ?? 0);
}

/** Positioning slices for a shift inside the day cell. */
export function shiftSlices(shift: Shift): { left: number; width: number }[] {
  const dayMin = DAY_START_HOUR * 60;
  const dayMax = DAY_END_HOUR   * 60;
  const total  = dayMax - dayMin;
  const start  = toMinutes(shift.startTime);
  const end    = toMinutes(shift.endTime);

  const clip = (s: number, e: number): { left: number; width: number } | null => {
    const cs = Math.max(s, dayMin);
    const ce = Math.min(e, dayMax);
    if (ce <= cs) return null;
    return { left: ((cs - dayMin) / total) * 100, width: ((ce - cs) / total) * 100 };
  };

  if (start <= end) {
    const slice = clip(start, end);
    return slice ? [slice] : [];
  }
  const out: { left: number; width: number }[] = [];
  const tail = clip(start, 24 * 60);
  if (tail) out.push(tail);
  const head = clip(0, end);
  if (head) out.push(head);
  return out;
}

/** Single-slice helper for callers that don't care about overnight wrap. */
export function shiftWindow(shift: Shift): { left: number; width: number } {
  const slices = shiftSlices(shift);
  return slices.length > 0 ? slices[0] : { left: 0, width: 0 };
}

/** Whether the shift overlaps "now". */
export function isCurrentlyOnShift(shift: Shift, now = new Date()): boolean {
  const dow = ((now.getDay() + 6) % 7) + 1; // 1 = Monday ... 7 = Sunday (ISO)
  if (!shift.daysOfWeek.includes(dow)) return false;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const start   = toMinutes(shift.startTime);
  const end     = toMinutes(shift.endTime);
  return start <= end
      ? minutes >= start && minutes <= end
      : minutes >= start || minutes <= end;
}

export interface ShiftStyle {
  bg:     string;
  border: string;
  text:   string;
  icon:   string;
  kind:   'morning' | 'evening' | 'night' | 'oncall' | 'default';
}

const PALETTE: Record<ShiftStyle['kind'], ShiftStyle> = {
  morning: { bg: '#fef3c7', border: '#fcd34d', text: '#92400e', icon: '☀',  kind: 'morning' },
  evening: { bg: '#e0e7ff', border: '#a5b4fc', text: '#3730a3', icon: '☾',  kind: 'evening' },
  night:   { bg: '#1e1b4b', border: '#312e81', text: '#e0e7ff', icon: '☾',  kind: 'night'   },
  oncall:  { bg: '#fee2e2', border: '#f87171', text: '#991b1b', icon: '⏰', kind: 'oncall'  },
  default: { bg: '#f4f4f5', border: '#d4d4d8', text: '#27272a', icon: '·',  kind: 'default' },
};

export function paletteFor(name: string): ShiftStyle {
  const k = name.toLowerCase();
  if (k.includes('morning')) return PALETTE.morning;
  if (k.includes('evening')) return PALETTE.evening;
  if (k.includes('night'))   return PALETTE.night;
  if (k.includes('on-call') || k.includes('oncall') || k.includes('on call')) return PALETTE.oncall;
  return PALETTE.default;
}

/** ISO-8601 day of week (1 = Mon, 7 = Sun) for a given Date. */
export function isoDow(d: Date): number {
  return ((d.getDay() + 6) % 7) + 1;
}

/** Monday-aligned start of the week containing {@code d}. */
export function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - (isoDow(x) - 1));
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
      && a.getMonth()    === b.getMonth()
      && a.getDate()     === b.getDate();
}

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function fmtWeekLabel(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${weekStart.getDate()} – ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]} ${end.getFullYear()}`;
  }
  return `${weekStart.getDate()} ${MONTHS_SHORT[weekStart.getMonth()]} – ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]} ${end.getFullYear()}`;
}

export const DAY_NAMES_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
