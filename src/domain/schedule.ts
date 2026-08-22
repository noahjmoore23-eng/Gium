import { round } from './estimate';

export type JobStatus = 'quoted' | 'booked' | 'inProgress' | 'complete' | 'cancelled';

export type MoverRole = 'lead' | 'mover' | 'driver';

export interface Mover {
  id: string;
  name: string;
  role: MoverRole;
  /** Hours this mover can work in a day before the job runs into overtime. */
  maxHoursPerDay: number;
}

export interface Job {
  id: string;
  customer: string;
  phone: string;
  originAddress: string;
  destinationAddress: string;
  /** Calendar date in YYYY-MM-DD. */
  date: string;
  /** Crew start time in 24-hour HH:MM. */
  startTime: string;
  estimatedHours: number;
  /** Crew size the estimator recommended, used to spot understaffed jobs. */
  recommendedCrew: number;
  volumeCuFt: number;
  quoteTotal: number;
  moverIds: string[];
  truckId: string | null;
  status: JobStatus;
  notes: string;
}

export type ConflictSeverity = 'error' | 'warning';

export interface Conflict {
  jobId: string;
  severity: ConflictSeverity;
  message: string;
}

/** Jobs that no longer occupy crew or trucks, and so cannot conflict. */
const INACTIVE: JobStatus[] = ['cancelled', 'complete'];

export function isActive(job: Job): boolean {
  return !INACTIVE.includes(job.status);
}

/** Minutes past midnight for an HH:MM time string. */
export function minutesFromTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
  return hours * 60 + minutes;
}

export function timeFromMinutes(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Math.round(totalMinutes)));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export interface JobWindow {
  startMinutes: number;
  endMinutes: number;
}

export function windowOf(job: Job): JobWindow {
  const startMinutes = minutesFromTime(job.startTime);
  return {
    startMinutes,
    endMinutes: startMinutes + Math.round(job.estimatedHours * 60),
  };
}

export function windowsOverlap(a: JobWindow, b: JobWindow): boolean {
  return a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;
}

/**
 * Every scheduling problem across the whole board. Double-booking a mover or a
 * truck is an error — the job physically cannot run. Understaffing and long
 * days are warnings: they are legal, they just cost money.
 */
export function findConflicts(jobs: Job[], movers: Mover[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const active = jobs.filter(isActive);
  const moversById = new Map(movers.map((mover) => [mover.id, mover]));

  const byDate = new Map<string, Job[]>();
  for (const job of active) {
    const forDate = byDate.get(job.date) ?? [];
    forDate.push(job);
    byDate.set(job.date, forDate);
  }

  for (const sameDay of byDate.values()) {
    for (let i = 0; i < sameDay.length; i += 1) {
      for (let j = i + 1; j < sameDay.length; j += 1) {
        const a = sameDay[i];
        const b = sameDay[j];
        if (!windowsOverlap(windowOf(a), windowOf(b))) continue;

        const sharedMovers = a.moverIds.filter((id) => b.moverIds.includes(id));
        for (const moverId of sharedMovers) {
          const name = moversById.get(moverId)?.name ?? moverId;
          conflicts.push({
            jobId: b.id,
            severity: 'error',
            message: `${name} is already on ${a.customer} at the same time.`,
          });
        }

        if (a.truckId && a.truckId === b.truckId) {
          conflicts.push({
            jobId: b.id,
            severity: 'error',
            message: `Truck is already assigned to ${a.customer} at the same time.`,
          });
        }
      }
    }

    // Daily hour caps are per mover, across every job they are on that day.
    const hoursByMover = new Map<string, number>();
    for (const job of sameDay) {
      for (const moverId of job.moverIds) {
        hoursByMover.set(moverId, (hoursByMover.get(moverId) ?? 0) + job.estimatedHours);
      }
    }
    for (const [moverId, hours] of hoursByMover) {
      const mover = moversById.get(moverId);
      if (!mover || hours <= mover.maxHoursPerDay) continue;
      const lastJob = sameDay.filter((job) => job.moverIds.includes(moverId)).at(-1);
      if (!lastJob) continue;
      conflicts.push({
        jobId: lastJob.id,
        severity: 'warning',
        message: `${mover.name} is booked ${round(hours, 1)} hrs, over their ${mover.maxHoursPerDay} hr day.`,
      });
    }
  }

  for (const job of active) {
    if (job.moverIds.length === 0) {
      conflicts.push({ jobId: job.id, severity: 'error', message: 'No crew assigned.' });
    } else if (job.moverIds.length < job.recommendedCrew) {
      conflicts.push({
        jobId: job.id,
        severity: 'warning',
        message: `${job.moverIds.length} of ${job.recommendedCrew} recommended movers assigned.`,
      });
    }

    if (!job.truckId) {
      conflicts.push({ jobId: job.id, severity: 'error', message: 'No truck assigned.' });
    }
  }

  return conflicts;
}

export function conflictsByJob(conflicts: Conflict[]): Map<string, Conflict[]> {
  const grouped = new Map<string, Conflict[]>();
  for (const conflict of conflicts) {
    const forJob = grouped.get(conflict.jobId) ?? [];
    forJob.push(conflict);
    grouped.set(conflict.jobId, forJob);
  }
  return grouped;
}

export interface DayMetrics {
  date: string;
  jobCount: number;
  bookedHours: number;
  /** Crew-hours available that day, across every mover on the roster. */
  capacityHours: number;
  utilization: number;
  revenue: number;
  volumeCuFt: number;
}

/**
 * Utilization is the number a moving company lives or dies by: idle crew is
 * pure cost, and over 100% means someone is working unpaid overtime.
 */
export function dayMetrics(date: string, jobs: Job[], movers: Mover[]): DayMetrics {
  const forDate = jobs.filter((job) => job.date === date && isActive(job));
  const bookedHours = forDate.reduce(
    (sum, job) => sum + job.estimatedHours * Math.max(job.moverIds.length, 1),
    0,
  );
  const capacityHours = movers.reduce((sum, mover) => sum + mover.maxHoursPerDay, 0);

  return {
    date,
    jobCount: forDate.length,
    bookedHours: round(bookedHours, 1),
    capacityHours: round(capacityHours, 1),
    utilization: capacityHours > 0 ? round(bookedHours / capacityHours, 3) : 0,
    revenue: round(
      forDate.reduce((sum, job) => sum + job.quoteTotal, 0),
      2,
    ),
    volumeCuFt: round(
      forDate.reduce((sum, job) => sum + job.volumeCuFt, 0),
      1,
    ),
  };
}

/** ISO dates for the Monday-to-Sunday week containing the given date. */
export function weekDates(anchor: string): string[] {
  const date = new Date(`${anchor}T00:00:00`);
  const weekday = (date.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(date);
  monday.setDate(date.getDate() - weekday);

  return Array.from({ length: 7 }, (_, offset) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + offset);
    return day.toISOString().slice(0, 10);
  });
}
