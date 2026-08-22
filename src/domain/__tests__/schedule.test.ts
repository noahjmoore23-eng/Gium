import { describe, expect, it } from 'vitest';
import {
  conflictsByJob,
  dayMetrics,
  findConflicts,
  isActive,
  minutesFromTime,
  timeFromMinutes,
  weekDates,
  windowOf,
  windowsOverlap,
} from '../schedule';
import type { Job, Mover } from '../schedule';

const movers: Mover[] = [
  { id: 'm1', name: 'Ray', role: 'lead', maxHoursPerDay: 10 },
  { id: 'm2', name: 'Dev', role: 'mover', maxHoursPerDay: 10 },
  { id: 'm3', name: 'Sam', role: 'driver', maxHoursPerDay: 8 },
];

function job(overrides: Partial<Job> = {}): Job {
  return {
    id: 'j1',
    customer: 'Acme',
    phone: '555-0100',
    originAddress: '1 Old St',
    destinationAddress: '2 New St',
    date: '2026-09-14',
    startTime: '08:00',
    estimatedHours: 4,
    recommendedCrew: 2,
    volumeCuFt: 500,
    quoteTotal: 1200,
    moverIds: ['m1', 'm2'],
    truckId: 'box-20',
    status: 'booked',
    notes: '',
    ...overrides,
  };
}

describe('time helpers', () => {
  it('round-trips a time through minutes', () => {
    expect(minutesFromTime('08:30')).toBe(510);
    expect(timeFromMinutes(510)).toBe('08:30');
  });

  it('clamps out-of-range minutes into the day', () => {
    expect(timeFromMinutes(-60)).toBe('00:00');
    expect(timeFromMinutes(99999)).toBe('23:59');
  });

  it('derives the job window from start time and duration', () => {
    expect(windowOf(job({ startTime: '09:00', estimatedHours: 2.5 }))).toEqual({
      startMinutes: 540,
      endMinutes: 690,
    });
  });
});

describe('windowsOverlap', () => {
  it('detects overlapping windows', () => {
    expect(windowsOverlap({ startMinutes: 0, endMinutes: 60 }, { startMinutes: 30, endMinutes: 90 })).toBe(true);
  });

  it('treats back-to-back windows as clear', () => {
    expect(windowsOverlap({ startMinutes: 0, endMinutes: 60 }, { startMinutes: 60, endMinutes: 120 })).toBe(false);
  });
});

describe('isActive', () => {
  it('excludes cancelled and completed jobs from the board', () => {
    expect(isActive(job({ status: 'booked' }))).toBe(true);
    expect(isActive(job({ status: 'cancelled' }))).toBe(false);
    expect(isActive(job({ status: 'complete' }))).toBe(false);
  });
});

describe('findConflicts', () => {
  it('finds nothing wrong with a well-staffed job', () => {
    expect(findConflicts([job()], movers)).toEqual([]);
  });

  it('flags a mover booked on two overlapping jobs', () => {
    const conflicts = findConflicts(
      [job(), job({ id: 'j2', customer: 'Beta', startTime: '10:00', truckId: 'box-26' })],
      movers,
    );
    expect(conflicts.some((c) => c.jobId === 'j2' && c.message.includes('Ray'))).toBe(true);
    expect(conflicts.every((c) => c.severity === 'error')).toBe(true);
  });

  it('lets the same mover work two jobs that do not overlap', () => {
    const conflicts = findConflicts(
      [
        job({ startTime: '08:00', estimatedHours: 3 }),
        job({ id: 'j2', customer: 'Beta', startTime: '13:00', estimatedHours: 3 }),
      ],
      movers,
    );
    expect(conflicts).toEqual([]);
  });

  it('flags a truck double-booked at the same time', () => {
    const conflicts = findConflicts(
      [job(), job({ id: 'j2', customer: 'Beta', startTime: '10:00', moverIds: ['m3'], recommendedCrew: 1 })],
      movers,
    );
    expect(conflicts.some((c) => c.message.includes('Truck is already assigned'))).toBe(true);
  });

  it('ignores conflicts with cancelled jobs', () => {
    const conflicts = findConflicts(
      [job(), job({ id: 'j2', customer: 'Beta', status: 'cancelled' })],
      movers,
    );
    expect(conflicts).toEqual([]);
  });

  it('warns when a mover is booked past their daily cap', () => {
    const conflicts = findConflicts(
      [
        job({ startTime: '06:00', estimatedHours: 6, moverIds: ['m3'], recommendedCrew: 1, truckId: 'box-16' }),
        job({ id: 'j2', customer: 'Beta', startTime: '13:00', estimatedHours: 5, moverIds: ['m3'], recommendedCrew: 1, truckId: 'box-20' }),
      ],
      movers,
    );
    const capWarning = conflicts.find((c) => c.message.includes('over their 8 hr day'));
    expect(capWarning).toBeDefined();
    expect(capWarning?.severity).toBe('warning');
  });

  it('errors on a job with no crew and no truck', () => {
    const conflicts = findConflicts([job({ moverIds: [], truckId: null })], movers);
    expect(conflicts.map((c) => c.message)).toEqual(
      expect.arrayContaining(['No crew assigned.', 'No truck assigned.']),
    );
  });

  it('warns about an understaffed job without blocking it', () => {
    const conflicts = findConflicts([job({ moverIds: ['m1'], recommendedCrew: 3 })], movers);
    const understaffed = conflicts.find((c) => c.message.includes('1 of 3'));
    expect(understaffed?.severity).toBe('warning');
  });

  it('does not compare jobs on different days', () => {
    const conflicts = findConflicts(
      [job(), job({ id: 'j2', customer: 'Beta', date: '2026-09-15' })],
      movers,
    );
    expect(conflicts).toEqual([]);
  });
});

describe('conflictsByJob', () => {
  it('groups conflicts under the job they belong to', () => {
    const grouped = conflictsByJob(findConflicts([job({ moverIds: [], truckId: null })], movers));
    expect(grouped.get('j1')).toHaveLength(2);
  });
});

describe('dayMetrics', () => {
  it('measures booked crew-hours against roster capacity', () => {
    const metrics = dayMetrics('2026-09-14', [job({ estimatedHours: 4 })], movers);
    expect(metrics.jobCount).toBe(1);
    expect(metrics.bookedHours).toBe(8); // 4 hrs x 2 movers
    expect(metrics.capacityHours).toBe(28); // 10 + 10 + 8
    expect(metrics.utilization).toBeCloseTo(8 / 28, 3);
  });

  it('sums revenue and volume for the day', () => {
    const metrics = dayMetrics(
      '2026-09-14',
      [job(), job({ id: 'j2', quoteTotal: 800, volumeCuFt: 300 })],
      movers,
    );
    expect(metrics.revenue).toBe(2000);
    expect(metrics.volumeCuFt).toBe(800);
  });

  it('leaves cancelled work out of the numbers', () => {
    const metrics = dayMetrics('2026-09-14', [job({ status: 'cancelled' })], movers);
    expect(metrics.jobCount).toBe(0);
    expect(metrics.revenue).toBe(0);
  });

  it('reports zero utilization with no movers on the roster', () => {
    expect(dayMetrics('2026-09-14', [job()], []).utilization).toBe(0);
  });
});

describe('weekDates', () => {
  it('returns Monday through Sunday for a mid-week date', () => {
    const week = weekDates('2026-09-16'); // a Wednesday
    expect(week).toHaveLength(7);
    expect(week[0]).toBe('2026-09-14');
    expect(week[6]).toBe('2026-09-20');
  });

  it('treats Sunday as the end of its week, not the start', () => {
    expect(weekDates('2026-09-20')[0]).toBe('2026-09-14');
  });
});
