import { describe, expect, it } from 'vitest';
import { estimate } from '../estimate';
import {
  DEFAULT_RATE_CARD,
  billableHours,
  classifyMove,
  defaultDeclaredValue,
  quote,
} from '../pricing';
import type { MoveRequest, SiteAccess } from '../types';

const easyAccess: SiteAccess = { type: 'ground', flights: 0, carryFeet: 20, shuttle: false };

function request(overrides: Partial<MoveRequest> = {}): MoveRequest {
  return {
    inventory: { 'bed-queen': 1, 'sofa-3': 1, 'box-md': 20 },
    origin: easyAccess,
    destination: easyAccess,
    distanceMiles: 15,
    packingService: false,
    ...overrides,
  };
}

function priceOf(overrides: Partial<MoveRequest> = {}, declaredValue?: number) {
  const req = request(overrides);
  return quote(req, estimate(req), DEFAULT_RATE_CARD, declaredValue);
}

function lineAmount(q: ReturnType<typeof priceOf>, label: string): number {
  return q.lineItems.find((item) => item.label === label)?.amount ?? 0;
}

describe('billableHours', () => {
  it('rounds up to the next quarter hour', () => {
    expect(billableHours(3.1, 0)).toBe(3.25);
    expect(billableHours(3.25, 0)).toBe(3.25);
    expect(billableHours(3.26, 0)).toBe(3.5);
  });

  it('never bills below the minimum', () => {
    expect(billableHours(1.2, 3)).toBe(3);
  });
});

describe('classifyMove', () => {
  it('prices short hauls hourly and long hauls by weight', () => {
    expect(classifyMove(40, DEFAULT_RATE_CARD)).toBe('local');
    expect(classifyMove(100, DEFAULT_RATE_CARD)).toBe('local');
    expect(classifyMove(101, DEFAULT_RATE_CARD)).toBe('longDistance');
  });
});

describe('defaultDeclaredValue', () => {
  it('values a shipment at $6 per pound, to the nearest $100', () => {
    expect(defaultDeclaredValue(1000)).toBe(6000);
  });
});

describe('quote — local moves', () => {
  it('bills labor as hours x crew x rate', () => {
    const q = priceOf();
    expect(q.kind).toBe('local');
    expect(lineAmount(q, 'Labor')).toBeCloseTo(
      q.billableHours * 2 * DEFAULT_RATE_CARD.hourlyPerMover,
      2,
    );
  });

  it('includes travel time in the billed hours', () => {
    const req = request();
    const est = estimate(req);
    expect(q0(req).billableHours).toBeGreaterThanOrEqual(
      est.hours.total + DEFAULT_RATE_CARD.travelFeeHours,
    );
  });

  it('charges the truck fee once per load', () => {
    expect(lineAmount(priceOf(), 'Truck & equipment')).toBe(DEFAULT_RATE_CARD.truckFee);
  });

  it('totals to the sum of its line items', () => {
    const q = priceOf();
    const sum = q.lineItems.reduce((acc, item) => acc + item.amount, 0);
    expect(q.total).toBeCloseTo(sum, 2);
  });

  it('never quotes below the hourly minimum', () => {
    const q = priceOf({ inventory: { nightstand: 1 } });
    expect(q.billableHours).toBe(DEFAULT_RATE_CARD.minimumHours);
  });
});

describe('quote — long distance', () => {
  it('switches to line haul plus mileage past the threshold', () => {
    const q = priceOf({ distanceMiles: 600 });
    expect(q.kind).toBe('longDistance');
    expect(q.billableHours).toBe(0);
    expect(lineAmount(q, 'Line haul')).toBeGreaterThan(0);
    expect(lineAmount(q, 'Mileage')).toBeCloseTo(600 * DEFAULT_RATE_CARD.perMileRate, 2);
    expect(lineAmount(q, 'Labor')).toBe(0);
  });

  it('applies the fuel surcharge to line haul and mileage', () => {
    const q = priceOf({ distanceMiles: 600 });
    const base = lineAmount(q, 'Line haul') + lineAmount(q, 'Mileage');
    expect(lineAmount(q, 'Fuel surcharge')).toBeCloseTo(
      base * DEFAULT_RATE_CARD.fuelSurchargePct,
      1,
    );
  });

  it('costs more than the same shipment moved locally', () => {
    expect(priceOf({ distanceMiles: 600 }).total).toBeGreaterThan(priceOf().total);
  });
});

describe('quote — accessorials', () => {
  it('bills stairs per flight across both ends', () => {
    const q = priceOf({
      origin: { type: 'stairs', flights: 2, carryFeet: 20, shuttle: false },
      destination: { type: 'stairs', flights: 1, carryFeet: 20, shuttle: false },
    });
    expect(lineAmount(q, 'Stair carry')).toBe(3 * DEFAULT_RATE_CARD.stairsFeePerFlight);
  });

  it('bills long carry once per affected end', () => {
    const q = priceOf({
      origin: { type: 'ground', flights: 0, carryFeet: 200, shuttle: false },
      destination: { type: 'ground', flights: 0, carryFeet: 300, shuttle: false },
    });
    expect(lineAmount(q, 'Long carry')).toBe(2 * DEFAULT_RATE_CARD.longCarryFee);
  });

  it('bills a shuttle per affected end', () => {
    const q = priceOf({
      origin: { type: 'ground', flights: 0, carryFeet: 20, shuttle: true },
    });
    expect(lineAmount(q, 'Shuttle service')).toBe(DEFAULT_RATE_CARD.shuttleFee);
  });

  it('omits accessorial lines when access is clean', () => {
    const labels = priceOf().lineItems.map((item) => item.label);
    expect(labels).not.toContain('Stair carry');
    expect(labels).not.toContain('Long carry');
    expect(labels).not.toContain('Shuttle service');
  });

  it('charges packing materials by volume only when the crew packs', () => {
    expect(lineAmount(priceOf(), 'Packing materials')).toBe(0);
    const packed = priceOf({ packingService: true });
    expect(lineAmount(packed, 'Packing materials')).toBeCloseTo(
      estimate(request({ packingService: true })).volumeCuFt *
        DEFAULT_RATE_CARD.packingMaterialsPerCuFt,
      2,
    );
  });

  it('prices valuation off the declared value', () => {
    const q = priceOf({}, 20000);
    expect(q.declaredValue).toBe(20000);
    expect(lineAmount(q, 'Full-value protection')).toBeCloseTo(
      20 * DEFAULT_RATE_CARD.valuationPerThousand,
      2,
    );
  });

  it('drops the valuation line when the customer declines coverage', () => {
    const q = priceOf({}, 0);
    expect(q.lineItems.map((item) => item.label)).not.toContain('Full-value protection');
  });
});

function q0(req: MoveRequest) {
  return quote(req, estimate(req), DEFAULT_RATE_CARD);
}
