/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

// Cache for normalized plates to avoid regex overhead on large sets
const plateNormCache = new Map<string, string>();
const plateVariantsCache = new Map<string, string[]>();

/**
 * Normalizes a plate string by removing non-alphanumeric characters and converting to uppercase.
 */
export function normalizePlate(plate?: string | null): string {
  if (!plate || typeof plate !== 'string') return '';
  const cached = plateNormCache.get(plate);
  if (cached !== undefined) return cached;

  const clean = plate.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (plateNormCache.size > 2000) {
    plateNormCache.clear();
  }
  plateNormCache.set(plate, clean);
  return clean;
}

const mappingLetterToNumber: Record<string, string> = {
  'A': '0', 'B': '1', 'C': '2', 'D': '3', 'E': '4',
  'F': '5', 'G': '6', 'H': '7', 'I': '8', 'J': '9'
};
const mappingNumberToLetter: Record<string, string> = {
  '0': 'A', '1': 'B', '2': 'C', '3': 'D', '4': 'E',
  '5': 'F', '6': 'G', '7': 'H', '8': 'I', '9': 'J'
};

/**
 * Returns the Mercosul and Old variants of a plate if it's exactly 7 characters long.
 * Otherwise, returns the normalized plate as the single variant.
 */
export function getPlateVariants(plate?: string | null): string[] {
  const clean = normalizePlate(plate);
  if (!clean) return [];
  const cached = plateVariantsCache.get(clean);
  if (cached !== undefined) return cached;

  if (clean.length !== 7) {
    const single = [clean];
    plateVariantsCache.set(clean, single);
    return single;
  }

  const char4 = clean[4];
  const variants = [clean];
  if (mappingLetterToNumber[char4] !== undefined) {
    const alternative = clean.substring(0, 4) + mappingLetterToNumber[char4] + clean.substring(5);
    variants.push(alternative);
  } else if (mappingNumberToLetter[char4] !== undefined) {
    const alternative = clean.substring(0, 4) + mappingNumberToLetter[char4] + clean.substring(5);
    variants.push(alternative);
  }

  if (plateVariantsCache.size > 2000) {
    plateVariantsCache.clear();
  }
  plateVariantsCache.set(clean, variants);
  return variants;
}

/**
 * Checks if a target plate (or any of its variants) matches a search query.
 */
export function plateMatchesSearch(targetPlate?: string | null, searchQuery?: string | null): boolean {
  if (!targetPlate || typeof targetPlate !== 'string') return false;
  if (!searchQuery || typeof searchQuery !== 'string') return false;
  const cleanQuery = normalizePlate(searchQuery);
  if (!cleanQuery) return false;
  const cleanTarget = normalizePlate(targetPlate);
  if (!cleanTarget) return false;

  const variants = getPlateVariants(targetPlate);
  return variants.some(variant => variant.includes(cleanQuery));
}
