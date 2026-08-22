import { getItem } from './catalog';
import type { Inventory, MoveRequest, SiteAccess, Truck } from './types';

/**
 * Household goods average about 7 lbs per cubic foot. Carriers use this to
 * convert a cube-sheet survey into the billable weight for a long-distance
 * move, so the two numbers stay consistent with each other.
 */
export const LBS_PER_CU_FT = 7;

/** Cubic feet one mover loads per hour, including padding and wrapping. */
export const LOAD_CU_FT_PER_MOVER_HOUR = 110;

/** Unloading runs faster than loading: nothing has to be wrapped. */
export const UNLOAD_CU_FT_PER_MOVER_HOUR = 140;

/** Full-service packing is the slowest phase of the job. */
export const PACK_CU_FT_PER_MOVER_HOUR = 55;

/** Extra crew-hours for each item needing disassembly or special equipment. */
export const BULKY_ITEM_HOURS = 0.5;

/** Carries longer than this are billed and timed as a long carry. */
export const LONG_CARRY_THRESHOLD_FT = 75;

export const FLEET: Truck[] = [
  { id: 'box-16', label: '16 ft box truck', lengthFt: 16, capacityCuFt: 800 },
  { id: 'box-20', label: '20 ft box truck', lengthFt: 20, capacityCuFt: 1000 },
  { id: 'box-26', label: '26 ft box truck', lengthFt: 26, capacityCuFt: 1600 },
  { id: 'trailer-53', label: '53 ft trailer', lengthFt: 53, capacityCuFt: 3800 },
];

export interface TruckPlan {
  truck: Truck;
  /** How many round trips this truck needs to move the whole load. */
  loads: number;
  /** Fraction of the truck's capacity the shipment fills, 0-1+. */
  utilization: number;
}

export interface Estimate {
  volumeCuFt: number;
  weightLbs: number;
  itemCount: number;
  crewSize: number;
  /** Whether crewSize came from the caller or was recommended from volume. */
  crewSizeSource: 'requested' | 'recommended';
  truckPlan: TruckPlan;
  hours: {
    pack: number;
    load: number;
    unload: number;
    drive: number;
    /** Handling allowance for pianos, safes, and other bulky items. */
    bulky: number;
    /** Sum of the above, before the hourly minimum is applied. */
    total: number;
  };
  /** Operational warnings the dispatcher should see before quoting. */
  flags: string[];
}

/** Total packed volume of an inventory, in cubic feet. */
export function volumeOf(inventory: Inventory): number {
  let total = 0;
  for (const [id, qty] of Object.entries(inventory)) {
    const item = getItem(id);
    if (!item || !Number.isFinite(qty) || qty <= 0) continue;
    total += item.cuFt * qty;
  }
  return round(total, 1);
}

/** Number of physical pieces in an inventory. */
export function itemCountOf(inventory: Inventory): number {
  let count = 0;
  for (const [id, qty] of Object.entries(inventory)) {
    if (!getItem(id) || !Number.isFinite(qty) || qty <= 0) continue;
    count += qty;
  }
  return count;
}

/** Count of pieces flagged bulky, which drive the handling allowance. */
export function bulkyCountOf(inventory: Inventory): number {
  let count = 0;
  for (const [id, qty] of Object.entries(inventory)) {
    const item = getItem(id);
    if (!item?.bulky || !Number.isFinite(qty) || qty <= 0) continue;
    count += qty;
  }
  return count;
}

/**
 * Crew size that keeps a job inside a single working day. Under-crewing is the
 * most common way a mover loses money: the job runs into overtime and the
 * hourly minimum stops covering the cost of the truck sitting there.
 */
export function recommendCrewSize(volumeCuFt: number): number {
  if (volumeCuFt < 400) return 2;
  if (volumeCuFt < 900) return 3;
  if (volumeCuFt < 1600) return 4;
  if (volumeCuFt < 2400) return 5;
  return 6;
}

/**
 * How much slower each end of the move runs because of stairs, elevators,
 * long carries, or a shuttle. Returns a multiplier applied to that end's
 * handling time — 1 means ideal ground-floor, door-at-the-truck access.
 */
export function accessMultiplier(site: SiteAccess): number {
  let multiplier = 1;

  if (site.type === 'stairs') {
    multiplier += 0.15 * Math.max(0, site.flights);
  } else if (site.type === 'elevator') {
    multiplier += 0.2;
  }

  if (site.carryFeet > LONG_CARRY_THRESHOLD_FT) {
    const extraFeet = site.carryFeet - LONG_CARRY_THRESHOLD_FT;
    multiplier += 0.1 * Math.ceil(extraFeet / 50);
  }

  if (site.shuttle) {
    multiplier += 0.35;
  }

  return round(multiplier, 3);
}

/** Smallest truck that holds the shipment, or the largest with extra loads. */
export function planTruck(volumeCuFt: number): TruckPlan {
  const fit = FLEET.find((truck) => truck.capacityCuFt >= volumeCuFt);
  if (fit) {
    return {
      truck: fit,
      loads: 1,
      utilization: round(volumeCuFt / fit.capacityCuFt, 3),
    };
  }

  const largest = FLEET[FLEET.length - 1];
  const loads = Math.ceil(volumeCuFt / largest.capacityCuFt);
  return {
    truck: largest,
    loads,
    utilization: round(volumeCuFt / (largest.capacityCuFt * loads), 3),
  };
}

/** Average road speed in mph: in-town crawl locally, highway over distance. */
function averageSpeed(distanceMiles: number): number {
  return distanceMiles <= 50 ? 30 : 50;
}

export function estimate(request: MoveRequest): Estimate {
  const volumeCuFt = volumeOf(request.inventory);
  const itemCount = itemCountOf(request.inventory);
  const bulkyCount = bulkyCountOf(request.inventory);

  const recommended = recommendCrewSize(volumeCuFt);
  const crewSize =
    request.crewSize && request.crewSize > 0 ? Math.floor(request.crewSize) : recommended;
  const crewSizeSource = request.crewSize && request.crewSize > 0 ? 'requested' : 'recommended';

  const originAccess = accessMultiplier(request.origin);
  const destinationAccess = accessMultiplier(request.destination);

  const packHours = request.packingService
    ? volumeCuFt / (PACK_CU_FT_PER_MOVER_HOUR * crewSize)
    : 0;
  const loadHours = (volumeCuFt / (LOAD_CU_FT_PER_MOVER_HOUR * crewSize)) * originAccess;
  const unloadHours =
    (volumeCuFt / (UNLOAD_CU_FT_PER_MOVER_HOUR * crewSize)) * destinationAccess;

  const truckPlan = planTruck(volumeCuFt);
  // Extra loads mean driving the route again, out and back.
  const driveHours =
    (request.distanceMiles / averageSpeed(request.distanceMiles)) * (2 * truckPlan.loads - 1);

  const bulkyHours = bulkyCount * BULKY_ITEM_HOURS;

  const total = packHours + loadHours + unloadHours + driveHours + bulkyHours;

  const flags: string[] = [];
  if (volumeCuFt === 0) {
    flags.push('No items in the inventory yet.');
  }
  if (truckPlan.loads > 1) {
    flags.push(
      `Shipment needs ${truckPlan.loads} loads on a ${truckPlan.truck.label} — consider a second truck.`,
    );
  }
  if (request.origin.shuttle || request.destination.shuttle) {
    flags.push('Shuttle required — confirm the small truck is scheduled.');
  }
  if (bulkyCount > 0) {
    flags.push(`${bulkyCount} bulky item(s) need special equipment or disassembly.`);
  }
  if (request.origin.type === 'stairs' && request.origin.flights >= 3) {
    flags.push('Three or more flights at origin — add a mover to avoid overtime.');
  }
  if (total > 8 && request.distanceMiles <= 50) {
    flags.push('Estimated over 8 hours — this will run into overtime as a single-day job.');
  }
  if (crewSizeSource === 'requested' && crewSize < recommended) {
    flags.push(`Crew of ${crewSize} is under the recommended ${recommended} for this volume.`);
  }

  return {
    volumeCuFt,
    weightLbs: Math.round(volumeCuFt * LBS_PER_CU_FT),
    itemCount,
    crewSize,
    crewSizeSource,
    truckPlan,
    hours: {
      pack: round(packHours, 2),
      load: round(loadHours, 2),
      unload: round(unloadHours, 2),
      drive: round(driveHours, 2),
      bulky: round(bulkyHours, 2),
      total: round(total, 2),
    },
    flags,
  };
}

export function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
