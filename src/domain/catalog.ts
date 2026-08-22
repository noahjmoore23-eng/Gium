import type { CatalogItem, RoomId } from './types';

export const ROOMS: { id: RoomId; label: string }[] = [
  { id: 'living', label: 'Living room' },
  { id: 'bedroom', label: 'Bedrooms' },
  { id: 'dining', label: 'Dining room' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'office', label: 'Office' },
  { id: 'garage', label: 'Garage & outdoor' },
  { id: 'boxes', label: 'Boxes' },
  { id: 'specialty', label: 'Specialty' },
];

/**
 * Cube-sheet values in cubic feet, following the volumes carriers use on
 * household-goods surveys. These are packed volumes: they already allow for
 * the padding and blanket-wrap an item takes up on the truck.
 */
export const CATALOG: CatalogItem[] = [
  // Living room
  { id: 'sofa-3', name: 'Sofa, 3-cushion', room: 'living', cuFt: 50 },
  { id: 'loveseat', name: 'Loveseat', room: 'living', cuFt: 35 },
  { id: 'sectional-piece', name: 'Sectional (per piece)', room: 'living', cuFt: 30 },
  { id: 'armchair', name: 'Armchair', room: 'living', cuFt: 15 },
  { id: 'recliner', name: 'Recliner', room: 'living', cuFt: 20 },
  { id: 'coffee-table', name: 'Coffee table', room: 'living', cuFt: 10 },
  { id: 'end-table', name: 'End table', room: 'living', cuFt: 5 },
  { id: 'bookcase-sm', name: 'Bookcase, small', room: 'living', cuFt: 10 },
  { id: 'bookcase-lg', name: 'Bookcase, large', room: 'living', cuFt: 20 },
  { id: 'tv-55', name: 'TV, 55" or under', room: 'living', cuFt: 8 },
  { id: 'tv-65', name: 'TV, over 55"', room: 'living', cuFt: 14 },
  { id: 'tv-stand', name: 'TV stand / media console', room: 'living', cuFt: 12 },
  { id: 'floor-lamp', name: 'Floor lamp', room: 'living', cuFt: 3 },
  { id: 'rug-lg', name: 'Rug, large (rolled)', room: 'living', cuFt: 10 },

  // Bedroom
  { id: 'bed-king', name: 'King bed set', room: 'bedroom', cuFt: 70 },
  { id: 'bed-queen', name: 'Queen bed set', room: 'bedroom', cuFt: 60 },
  { id: 'bed-full', name: 'Full bed set', room: 'bedroom', cuFt: 50 },
  { id: 'bed-twin', name: 'Twin bed set', room: 'bedroom', cuFt: 35 },
  { id: 'crib', name: 'Crib', room: 'bedroom', cuFt: 15 },
  { id: 'dresser-double', name: 'Dresser, double', room: 'bedroom', cuFt: 30 },
  { id: 'dresser-triple', name: 'Dresser, triple', room: 'bedroom', cuFt: 45 },
  { id: 'chest', name: 'Chest of drawers', room: 'bedroom', cuFt: 25 },
  { id: 'nightstand', name: 'Nightstand', room: 'bedroom', cuFt: 8 },
  { id: 'armoire', name: 'Armoire / wardrobe', room: 'bedroom', cuFt: 40 },
  { id: 'vanity', name: 'Vanity', room: 'bedroom', cuFt: 15 },
  { id: 'mirror', name: 'Mirror, framed', room: 'bedroom', cuFt: 5 },

  // Dining
  { id: 'dining-table', name: 'Dining table', room: 'dining', cuFt: 30 },
  { id: 'dining-chair', name: 'Dining chair', room: 'dining', cuFt: 5 },
  { id: 'china-cabinet', name: 'China cabinet', room: 'dining', cuFt: 45 },
  { id: 'buffet', name: 'Buffet / sideboard', room: 'dining', cuFt: 30 },
  { id: 'bar-stool', name: 'Bar stool', room: 'dining', cuFt: 5 },

  // Kitchen
  { id: 'fridge', name: 'Refrigerator, standard', room: 'kitchen', cuFt: 45 },
  { id: 'fridge-fd', name: 'Refrigerator, french door', room: 'kitchen', cuFt: 60 },
  { id: 'range', name: 'Range / stove', room: 'kitchen', cuFt: 30 },
  { id: 'dishwasher', name: 'Dishwasher', room: 'kitchen', cuFt: 20 },
  { id: 'microwave', name: 'Microwave', room: 'kitchen', cuFt: 5 },
  { id: 'kitchen-table', name: 'Kitchen table', room: 'kitchen', cuFt: 20 },
  { id: 'small-appliance', name: 'Small appliance', room: 'kitchen', cuFt: 3 },

  // Office
  { id: 'desk-sm', name: 'Desk, small', room: 'office', cuFt: 20 },
  { id: 'desk-exec', name: 'Desk, executive', room: 'office', cuFt: 40 },
  { id: 'office-chair', name: 'Office chair', room: 'office', cuFt: 10 },
  { id: 'file-2', name: 'File cabinet, 2-drawer', room: 'office', cuFt: 10 },
  { id: 'file-4', name: 'File cabinet, 4-drawer', room: 'office', cuFt: 15 },
  { id: 'computer', name: 'Computer & monitor', room: 'office', cuFt: 5 },
  { id: 'printer', name: 'Printer', room: 'office', cuFt: 5 },

  // Garage & outdoor
  { id: 'washer', name: 'Washer', room: 'garage', cuFt: 25 },
  { id: 'dryer', name: 'Dryer', room: 'garage', cuFt: 25 },
  { id: 'freezer', name: 'Freezer, chest', room: 'garage', cuFt: 30 },
  { id: 'mower-push', name: 'Lawn mower, push', room: 'garage', cuFt: 15 },
  { id: 'mower-riding', name: 'Lawn mower, riding', room: 'garage', cuFt: 60, bulky: true },
  { id: 'bicycle', name: 'Bicycle', room: 'garage', cuFt: 10 },
  { id: 'workbench', name: 'Workbench', room: 'garage', cuFt: 25 },
  { id: 'grill', name: 'Grill', room: 'garage', cuFt: 15 },
  { id: 'patio-table', name: 'Patio table', room: 'garage', cuFt: 20 },
  { id: 'patio-chair', name: 'Patio chair', room: 'garage', cuFt: 8 },
  { id: 'tool-chest', name: 'Tool chest', room: 'garage', cuFt: 15 },
  { id: 'ladder', name: 'Ladder', room: 'garage', cuFt: 10 },

  // Boxes
  { id: 'box-sm', name: 'Small box (1.5 cu ft)', room: 'boxes', cuFt: 1.5 },
  { id: 'box-md', name: 'Medium box (3.0 cu ft)', room: 'boxes', cuFt: 3 },
  { id: 'box-lg', name: 'Large box (4.5 cu ft)', room: 'boxes', cuFt: 4.5 },
  { id: 'box-xl', name: 'Extra-large box (6.0 cu ft)', room: 'boxes', cuFt: 6 },
  { id: 'box-wardrobe', name: 'Wardrobe box', room: 'boxes', cuFt: 12 },
  { id: 'box-dish', name: 'Dish pack', room: 'boxes', cuFt: 5 },
  { id: 'box-mirror', name: 'Mirror / picture carton', room: 'boxes', cuFt: 3 },
  { id: 'tote', name: 'Storage tote', room: 'boxes', cuFt: 3 },

  // Specialty
  { id: 'piano-upright', name: 'Piano, upright', room: 'specialty', cuFt: 70, bulky: true },
  { id: 'piano-grand', name: 'Piano, baby grand', room: 'specialty', cuFt: 90, bulky: true },
  { id: 'pool-table', name: 'Pool table', room: 'specialty', cuFt: 60, bulky: true },
  { id: 'gun-safe', name: 'Gun safe', room: 'specialty', cuFt: 40, bulky: true },
  { id: 'safe-sm', name: 'Safe, small', room: 'specialty', cuFt: 10 },
  { id: 'treadmill', name: 'Treadmill', room: 'specialty', cuFt: 30, bulky: true },
  { id: 'exercise-bike', name: 'Exercise bike', room: 'specialty', cuFt: 20 },
  { id: 'weight-bench', name: 'Weight bench', room: 'specialty', cuFt: 15 },
  { id: 'aquarium', name: 'Aquarium, large', room: 'specialty', cuFt: 20, bulky: true },
];

const BY_ID = new Map(CATALOG.map((item) => [item.id, item]));

export function getItem(id: string): CatalogItem | undefined {
  return BY_ID.get(id);
}

export function itemsInRoom(room: RoomId): CatalogItem[] {
  return CATALOG.filter((item) => item.room === room);
}
