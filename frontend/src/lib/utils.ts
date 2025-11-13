import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Deterministic pseudo-random coordinate within Hyderabad bbox for a given id
// Returns { lat, lng } in roughly [17.30..17.75], [78.35..78.80]
export function hyderabadCoordFromId(id: string): { lat: number; lng: number } {
  const hashToUnit = (seed: string, salt = 0) => {
    let h = 2166136261 ^ salt;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return ((h >>> 0) % 100000) / 100000; // 0..1
  };
  const r1 = hashToUnit(id, 1);
  const r2 = hashToUnit(id, 2);
  const lat = 17.30 + r1 * 0.45;
  const lng = 78.35 + r2 * 0.45;
  return { lat, lng };
}
