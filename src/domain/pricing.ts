import { round } from './estimate';
import type { Estimate } from './estimate';
import { LONG_CARRY_THRESHOLD_FT } from './estimate';
import type { MoveKind, MoveRequest, RateCard, SiteAccess } from './types';

export const DEFAULT_RATE_CARD: RateCard = {
  hourlyPerMover: 65,
  minimumHours: 3,
  truckFee: 95,
  travelFeeHours: 1,
  cwtRate: 62,
  perMileRate: 1.85,
  fuelSurchargePct: 0.12,
  longDistanceThresholdMiles: 100,
  packingMaterialsPerCuFt: 1.1,
  stairsFeePerFlight: 45,
  longCarryFee: 90,
  shuttleFee: 350,
  valuationPerThousand: 8.5,
};

export interface LineItem {
  label: string;
  /** Shown to the customer as the basis for the charge, e.g. "4 hrs x 3 movers". */
  detail: string;
  amount: number;
}

export interface Quote {
  kind: MoveKind;
  lineItems: LineItem[];
  subtotal: number;
  total: number;
  /** Hours actually billed, after the minimum. Zero on long-distance moves. */
  billableHours: number;
  /** Declared value used for the valuation premium. */
  declaredValue: number;
}

/** Local moves bill in quarter-hour increments, never below the minimum. */
export function billableHours(rawHours: number, minimumHours: number): number {
  const rounded = Math.ceil(rawHours * 4) / 4;
  return Math.max(rounded, minimumHours);
}

export function classifyMove(distanceMiles: number, rates: RateCard): MoveKind {
  return distanceMiles > rates.longDistanceThresholdMiles ? 'longDistance' : 'local';
}

/**
 * Default declared value for full-value protection. Carriers commonly use
 * $6 per pound of shipment weight as the minimum declared valuation.
 */
export function defaultDeclaredValue(weightLbs: number): number {
  return Math.round((weightLbs * 6) / 100) * 100;
}

function accessorials(
  origin: SiteAccess,
  destination: SiteAccess,
  rates: RateCard,
): LineItem[] {
  const items: LineItem[] = [];

  const flights =
    (origin.type === 'stairs' ? Math.max(0, origin.flights) : 0) +
    (destination.type === 'stairs' ? Math.max(0, destination.flights) : 0);
  if (flights > 0) {
    items.push({
      label: 'Stair carry',
      detail: `${flights} flight${flights === 1 ? '' : 's'} x $${rates.stairsFeePerFlight}`,
      amount: flights * rates.stairsFeePerFlight,
    });
  }

  const longCarries =
    (origin.carryFeet > LONG_CARRY_THRESHOLD_FT ? 1 : 0) +
    (destination.carryFeet > LONG_CARRY_THRESHOLD_FT ? 1 : 0);
  if (longCarries > 0) {
    items.push({
      label: 'Long carry',
      detail: `${longCarries} end${longCarries === 1 ? '' : 's'} over ${LONG_CARRY_THRESHOLD_FT} ft`,
      amount: longCarries * rates.longCarryFee,
    });
  }

  const shuttles = (origin.shuttle ? 1 : 0) + (destination.shuttle ? 1 : 0);
  if (shuttles > 0) {
    items.push({
      label: 'Shuttle service',
      detail: `${shuttles} end${shuttles === 1 ? '' : 's'} needing a shuttle`,
      amount: shuttles * rates.shuttleFee,
    });
  }

  return items;
}

export function quote(
  request: MoveRequest,
  est: Estimate,
  rates: RateCard = DEFAULT_RATE_CARD,
  declaredValueOverride?: number,
): Quote {
  const kind = classifyMove(request.distanceMiles, rates);
  const lineItems: LineItem[] = [];
  let hours = 0;

  if (kind === 'local') {
    hours = billableHours(est.hours.total + rates.travelFeeHours, rates.minimumHours);
    lineItems.push({
      label: 'Labor',
      detail: `${hours} hrs x ${est.crewSize} movers x $${rates.hourlyPerMover}/hr`,
      amount: hours * est.crewSize * rates.hourlyPerMover,
    });
    lineItems.push({
      label: 'Truck & equipment',
      detail: est.truckPlan.truck.label,
      amount: rates.truckFee * est.truckPlan.loads,
    });
  } else {
    const lineHaul = (est.weightLbs / 100) * rates.cwtRate;
    const mileage = request.distanceMiles * rates.perMileRate;
    lineItems.push({
      label: 'Line haul',
      detail: `${est.weightLbs.toLocaleString()} lbs at $${rates.cwtRate}/cwt`,
      amount: lineHaul,
    });
    lineItems.push({
      label: 'Mileage',
      detail: `${request.distanceMiles} mi x $${rates.perMileRate}/mi`,
      amount: mileage,
    });
    lineItems.push({
      label: 'Fuel surcharge',
      detail: `${Math.round(rates.fuelSurchargePct * 100)}% of line haul`,
      amount: (lineHaul + mileage) * rates.fuelSurchargePct,
    });
  }

  if (request.packingService) {
    lineItems.push({
      label: 'Packing materials',
      detail: `${est.volumeCuFt} cu ft x $${rates.packingMaterialsPerCuFt}/cu ft`,
      amount: est.volumeCuFt * rates.packingMaterialsPerCuFt,
    });
  }

  lineItems.push(...accessorials(request.origin, request.destination, rates));

  const declaredValue = declaredValueOverride ?? defaultDeclaredValue(est.weightLbs);
  if (declaredValue > 0) {
    lineItems.push({
      label: 'Full-value protection',
      detail: `$${declaredValue.toLocaleString()} declared at $${rates.valuationPerThousand}/$1,000`,
      amount: (declaredValue / 1000) * rates.valuationPerThousand,
    });
  }

  const priced = lineItems.map((item) => ({ ...item, amount: round(item.amount, 2) }));
  const subtotal = round(
    priced.reduce((sum, item) => sum + item.amount, 0),
    2,
  );

  return {
    kind,
    lineItems: priced,
    subtotal,
    total: subtotal,
    billableHours: kind === 'local' ? hours : 0,
    declaredValue,
  };
}
