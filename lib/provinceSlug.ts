export function normalizeProvinceSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[‘’'"`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getProvinceDetailsUrl(name: string): string {
  return `/province/${normalizeProvinceSlug(name)}`;
}

export function getProvinceNameFromSlug(slug: string, provinces: string[]): string | undefined {
  return provinces.find((name) => normalizeProvinceSlug(name) === slug);
}
