export const RADIUS_OPTIONS = [0.1, 0.25, 0.5, 1, 5, 20, 100] as const;
export type RadiusOption = (typeof RADIUS_OPTIONS)[number];

export function formatRadius(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km} km`;
}
