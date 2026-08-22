import { DEFAULT_RATE_CARD } from './pricing';
import type { Job, Mover } from './schedule';
import type { RateCard } from './types';

const KEY = 'gium.state.v1';

export interface AppState {
  company: string;
  rates: RateCard;
  movers: Mover[];
  jobs: Job[];
}

/** Dates relative to today, so a fresh install lands on the current week. */
function dayOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function seedState(): AppState {
  return {
    company: 'Your Moving Co.',
    rates: { ...DEFAULT_RATE_CARD },
    movers: [
      { id: 'm-ray', name: 'Ray Delgado', role: 'lead', maxHoursPerDay: 10 },
      { id: 'm-dev', name: 'Dev Okonkwo', role: 'mover', maxHoursPerDay: 10 },
      { id: 'm-sam', name: 'Sam Ruiz', role: 'driver', maxHoursPerDay: 9 },
      { id: 'm-tia', name: 'Tia Brennan', role: 'mover', maxHoursPerDay: 10 },
      { id: 'm-jo', name: 'Jo Winters', role: 'mover', maxHoursPerDay: 8 },
    ],
    jobs: [
      {
        id: 'job-1',
        customer: 'Harper Lane',
        phone: '(555) 019-4420',
        originAddress: '88 Bellwood Ave, Apt 3B',
        destinationAddress: '17 Corrigan St',
        date: dayOffset(1),
        startTime: '08:00',
        estimatedHours: 5.5,
        recommendedCrew: 3,
        volumeCuFt: 720,
        quoteTotal: 1685,
        moverIds: ['m-ray', 'm-dev', 'm-tia'],
        truckId: 'box-20',
        status: 'booked',
        notes: 'Third-floor walk-up at origin. Piano at destination stays.',
      },
      {
        id: 'job-2',
        customer: 'Nadia Oyelaran',
        phone: '(555) 019-7781',
        originAddress: '412 Kestrel Row',
        destinationAddress: '9 Fairmount Dr',
        date: dayOffset(1),
        startTime: '13:30',
        estimatedHours: 3,
        recommendedCrew: 2,
        volumeCuFt: 310,
        quoteTotal: 845,
        moverIds: ['m-sam', 'm-jo'],
        truckId: 'box-16',
        status: 'booked',
        notes: 'Studio apartment, customer-packed.',
      },
      {
        id: 'job-3',
        customer: 'Vaughn Property Group',
        phone: '(555) 019-2205',
        originAddress: '1200 Industrial Pkwy',
        destinationAddress: '55 Marsh Landing',
        date: dayOffset(3),
        startTime: '07:30',
        estimatedHours: 8,
        recommendedCrew: 4,
        volumeCuFt: 1480,
        quoteTotal: 3960,
        moverIds: ['m-ray', 'm-dev'],
        truckId: 'box-26',
        status: 'quoted',
        notes: 'Office relocation. Needs two more movers before this is bookable.',
      },
    ],
  };
}

/**
 * Merges stored state over the seed so a state file written by an older
 * version still loads once new fields are added.
 */
export function loadState(): AppState {
  const seed = seedState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      company: parsed.company ?? seed.company,
      rates: { ...seed.rates, ...parsed.rates },
      movers: parsed.movers ?? seed.movers,
      jobs: parsed.jobs ?? seed.jobs,
    };
  } catch {
    // Private browsing, cleared site data, or a corrupt payload.
    return seed;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable or full — the app still works for this session.
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to do if storage is unavailable.
  }
}
