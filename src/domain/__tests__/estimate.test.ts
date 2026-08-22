import { describe, expect, it } from 'vitest';
import {
  accessMultiplier,
  bulkyCountOf,
  estimate,
  itemCountOf,
  planTruck,
  recommendCrewSize,
  volumeOf,
  LBS_PER_CU_FT,
} from '../estimate';
import type { MoveRequest, SiteAccess } from '../types';

const easyAccess: SiteAccess = { type: 'ground', flights: 0, carryFeet: 20, shuttle: false };

function request(overrides: Partial<MoveRequest> = {}): MoveRequest {
  return {
    inventory: {},
    origin: easyAccess,
    destination: easyAccess,
    distanceMiles: 12,
    packingService: false,
    ...overrides,
  };
}

describe('volumeOf', () => {
  it('sums cube-sheet volumes across quantities', () => {
    // 60 + 2*8 + 10*3 = 106
    expect(volumeOf({ 'bed-queen': 1, nightstand: 2, 'box-md': 10 })).toBe(106);
  });

  it('ignores unknown ids and non-positive quantities', () => {
    expect(volumeOf({ 'not-a-real-item': 5, 'bed-queen': 0, armchair: -3 })).toBe(0);
  });

  it('is zero for an empty inventory', () => {
    expect(volumeOf({})).toBe(0);
  });
});

describe('itemCountOf and bulkyCountOf', () => {
  it('counts pieces, not line entries', () => {
    expect(itemCountOf({ 'dining-chair': 6, 'dining-table': 1 })).toBe(7);
  });

  it('counts only items flagged bulky', () => {
    expect(bulkyCountOf({ 'piano-upright': 1, 'pool-table': 1, armchair: 4 })).toBe(2);
  });
});

describe('recommendCrewSize', () => {
  it('scales the crew with volume', () => {
    expect(recommendCrewSize(200)).toBe(2);
    expect(recommendCrewSize(600)).toBe(3);
    expect(recommendCrewSize(1200)).toBe(4);
    expect(recommendCrewSize(2000)).toBe(5);
    expect(recommendCrewSize(3000)).toBe(6);
  });

  it('puts tier boundaries on the larger crew', () => {
    expect(recommendCrewSize(399)).toBe(2);
    expect(recommendCrewSize(400)).toBe(3);
  });
});

describe('accessMultiplier', () => {
  it('is 1 for ground-floor access with the truck at the door', () => {
    expect(accessMultiplier(easyAccess)).toBe(1);
  });

  it('adds 15% per flight of stairs', () => {
    expect(accessMultiplier({ ...easyAccess, type: 'stairs', flights: 2 })).toBeCloseTo(1.3, 5);
  });

  it('adds a flat allowance for elevator buildings', () => {
    expect(accessMultiplier({ ...easyAccess, type: 'elevator' })).toBeCloseTo(1.2, 5);
  });

  it('charges long carry in 50 ft steps past the threshold', () => {
    expect(accessMultiplier({ ...easyAccess, carryFeet: 75 })).toBe(1);
    expect(accessMultiplier({ ...easyAccess, carryFeet: 100 })).toBeCloseTo(1.1, 5);
    expect(accessMultiplier({ ...easyAccess, carryFeet: 180 })).toBeCloseTo(1.3, 5);
  });

  it('stacks stairs, long carry, and shuttle', () => {
    const site: SiteAccess = { type: 'stairs', flights: 1, carryFeet: 125, shuttle: true };
    // 1 + 0.15 + 0.10 + 0.35
    expect(accessMultiplier(site)).toBeCloseTo(1.6, 5);
  });
});

describe('planTruck', () => {
  it('picks the smallest truck that fits the shipment', () => {
    expect(planTruck(500).truck.id).toBe('box-16');
    expect(planTruck(950).truck.id).toBe('box-20');
    expect(planTruck(1500).truck.id).toBe('box-26');
  });

  it('reports utilization against the chosen truck', () => {
    expect(planTruck(400).utilization).toBeCloseTo(0.5, 3);
  });

  it('splits oversized shipments into multiple loads on the largest truck', () => {
    const plan = planTruck(9000);
    expect(plan.truck.id).toBe('trailer-53');
    expect(plan.loads).toBe(3);
    expect(plan.utilization).toBeLessThanOrEqual(1);
  });
});

describe('estimate', () => {
  it('converts volume to weight at the household-goods density', () => {
    const est = estimate(request({ inventory: { 'bed-queen': 1 } }));
    expect(est.volumeCuFt).toBe(60);
    expect(est.weightLbs).toBe(60 * LBS_PER_CU_FT);
  });

  it('recommends a crew when none is requested', () => {
    const est = estimate(request({ inventory: { 'bed-queen': 1 } }));
    expect(est.crewSizeSource).toBe('recommended');
    expect(est.crewSize).toBe(2);
  });

  it('honours an explicit crew size and flags under-crewing', () => {
    const est = estimate(request({ inventory: { 'piano-grand': 20 }, crewSize: 2 }));
    expect(est.crewSizeSource).toBe('requested');
    expect(est.crewSize).toBe(2);
    expect(est.flags.some((flag) => flag.includes('under the recommended'))).toBe(true);
  });

  it('unloads faster than it loads on identical access', () => {
    const est = estimate(request({ inventory: { 'box-md': 100 } }));
    expect(est.hours.unload).toBeLessThan(est.hours.load);
  });

  it('spends more time loading when the origin has stairs', () => {
    const flat = estimate(request({ inventory: { 'box-md': 100 } }));
    const walkUp = estimate(
      request({
        inventory: { 'box-md': 100 },
        origin: { type: 'stairs', flights: 2, carryFeet: 20, shuttle: false },
      }),
    );
    expect(walkUp.hours.load).toBeGreaterThan(flat.hours.load);
    expect(walkUp.hours.unload).toBe(flat.hours.unload);
  });

  it('adds packing hours only for full-service packing', () => {
    const selfPack = estimate(request({ inventory: { 'box-md': 100 } }));
    const fullService = estimate(request({ inventory: { 'box-md': 100 }, packingService: true }));
    expect(selfPack.hours.pack).toBe(0);
    expect(fullService.hours.pack).toBeGreaterThan(0);
    expect(fullService.hours.total).toBeGreaterThan(selfPack.hours.total);
  });

  it('adds a handling allowance for each bulky item', () => {
    const withPiano = estimate(request({ inventory: { 'piano-upright': 2 } }));
    expect(withPiano.hours.bulky).toBe(1);
  });

  it('drives the route out and back again for each extra load', () => {
    const single = estimate(request({ inventory: { 'box-md': 100 }, distanceMiles: 30 }));
    const multi = estimate(request({ inventory: { 'box-xl': 1500 }, distanceMiles: 30 }));
    expect(single.hours.drive).toBeCloseTo(1, 2);
    expect(multi.truckPlan.loads).toBeGreaterThan(1);
    expect(multi.hours.drive).toBeGreaterThan(single.hours.drive);
  });

  it('flags an empty inventory instead of quoting a free move', () => {
    const est = estimate(request());
    expect(est.volumeCuFt).toBe(0);
    expect(est.flags).toContain('No items in the inventory yet.');
  });

  it('warns when a local job will run past a normal day', () => {
    const est = estimate(request({ inventory: { 'box-md': 900 }, crewSize: 2 }));
    expect(est.hours.total).toBeGreaterThan(8);
    expect(est.flags.some((flag) => flag.includes('overtime'))).toBe(true);
  });

  it('adds crew to shorten the same job', () => {
    const small = estimate(request({ inventory: { 'box-md': 200 }, crewSize: 2 }));
    const large = estimate(request({ inventory: { 'box-md': 200 }, crewSize: 4 }));
    expect(large.hours.load).toBeLessThan(small.hours.load);
  });
});
