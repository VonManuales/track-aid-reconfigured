/**
 * Determines if a grant is associated with a specific province or the broader region.
 * Handles strict matching for Leyte vs Southern Leyte and Samar vs Northern/Eastern Samar.
 * Also includes projects that are tagged with regional aliases.
 */
export function isGrantAssociatedWithProvince(
  grantProvinces: string[],
  provinceName: string,
  title: string = '',
  description: string = ''
): boolean {
  const pName = provinceName.toLowerCase();
  const regionAliases = [
    'eastern visayas',
    'region 8',
    'region viii',
    'evisayas'
  ];

  const checkMatch = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Check regional aliases first (these match any province in Region VIII)
    if (regionAliases.some(alias => lowerText.includes(alias))) return true;

    // Strict check for "Leyte" to avoid false positives with "Southern Leyte"
    if (pName === 'leyte') {
      const totalLeyteCount = (lowerText.match(/leyte/g) || []).length;
      const southernLeyteCount = (lowerText.match(/southern\s+leyte/g) || []).length;
      return totalLeyteCount > southernLeyteCount;
    }

    // Strict check for "Samar" to avoid false positives with "Northern" or "Eastern" Samar
    if (pName === 'samar') {
      const totalSamarCount = (lowerText.match(/samar/g) || []).length;
      const specificSamarCount = (lowerText.match(/(northern|eastern)\s+samar/g) || []).length;
      return totalSamarCount > specificSamarCount;
    }

    return lowerText.includes(pName);
  };

  const hasLocationMatch = (grantProvinces || []).some((prov) => checkMatch(String(prov)));
  return hasLocationMatch || checkMatch(title + " " + description);
}