/** Region VIII (Eastern Visayas) scope for the predictability map. */
export const FOCUS_REGION = 'Region VIII';

export const FOCUS_REGION_LABEL = 'Eastern Visayas (Region VIII)';

export const REGION_VIII_CENTER: [number, number] = [11.5042, 124.9868];

/**
 * Map pan/zoom limits — centered on Region VIII with nearby geography visible,
 * but users cannot pan to the rest of the country.
 */
export const REGION_VIII_BOUNDS: [[number, number], [number, number]] = [
  [10.15, 124.25],
  [12.75, 125.95],
];

export const REGION_VIII_DEFAULT_ZOOM = 8;
export const REGION_VIII_MIN_ZOOM = 8;
export const REGION_VIII_MAX_ZOOM = 12;
export const REGION_VIII_FLY_ZOOM = 10;

export const REGION_VIII_PROVINCES = [
  'Biliran',
  'Eastern Samar',
  'Leyte',
  'Northern Samar',
  'Samar',
  'Southern Leyte',
] as const;

export function isRegionViiiProvince(region: string): boolean {
  return region === FOCUS_REGION;
}
