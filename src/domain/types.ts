/** Core domain types for Gium. */

export type RoomId =
  | 'living'
  | 'bedroom'
  | 'dining'
  | 'kitchen'
  | 'office'
  | 'garage'
  | 'boxes'
  | 'specialty';

export interface CatalogItem {
  /** Stable slug used as the key in inventory records. */
  id: string;
  name: string;
  room: RoomId;
  /** Packed volume in cubic feet, from standard cube-sheet values. */
  cuFt: number;
  /**
   * Items needing extra handling (disassembly, hoisting, 3+ movers).
   * Each bulky unit adds a fixed handling allowance to the labor estimate.
   */
  bulky?: boolean;
}

/** Map of catalog item id -> quantity. Absent or 0 means "none". */
export type Inventory = Record<string, number>;

export type MoveKind = 'local' | 'longDistance';

export type AccessType = 'ground' | 'stairs' | 'elevator';

/** Site conditions at one end of the move; they drive the access allowance. */
export interface SiteAccess {
  type: AccessType;
  /** Flights of stairs to carry (only meaningful when type is 'stairs'). */
  flights: number;
  /** Feet from truck parking to the door. Anything past 75ft is a "long carry". */
  carryFeet: number;
  /** Shuttle required because a 26ft truck cannot reach the door. */
  shuttle: boolean;
}

export interface MoveRequest {
  inventory: Inventory;
  origin: SiteAccess;
  destination: SiteAccess;
  /** One-way distance in miles between origin and destination. */
  distanceMiles: number;
  /** Full-service packing by the crew, rather than customer-packed. */
  packingService: boolean;
  /**
   * Crew size override. When omitted, the estimator recommends one from volume.
   */
  crewSize?: number;
}

export interface Truck {
  id: string;
  label: string;
  lengthFt: number;
  /** Usable capacity in cubic feet, after allowing for tie-down and padding. */
  capacityCuFt: number;
}

export interface RateCard {
  /** Billed per mover, per hour, on local hourly moves. */
  hourlyPerMover: number;
  /** Minimum billable hours on any local move. */
  minimumHours: number;
  /** Flat truck/equipment fee added to local moves. */
  truckFee: number;
  /** Billed once to cover travel to the origin and back from the destination. */
  travelFeeHours: number;
  /** Long-distance line-haul rate per 100 lbs (per hundredweight, "cwt"). */
  cwtRate: number;
  /** Long-distance rate per loaded mile, on top of the cwt line haul. */
  perMileRate: number;
  /** Fuel surcharge as a fraction of the line haul, e.g. 0.12 for 12%. */
  fuelSurchargePct: number;
  /** Distance past which a move is priced long-distance instead of hourly. */
  longDistanceThresholdMiles: number;
  /** Materials charge per cubic foot when the crew packs. */
  packingMaterialsPerCuFt: number;
  /** Charged per flight of stairs, per end of the move. */
  stairsFeePerFlight: number;
  /** Charged when carry distance exceeds the long-carry threshold. */
  longCarryFee: number;
  /** Charged when a shuttle truck is required at either end. */
  shuttleFee: number;
  /** Full-value protection premium per $1,000 of declared value. */
  valuationPerThousand: number;
}
