/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

/**
 * Normalizes a plate string by removing non-alphanumeric characters and converting to uppercase.
 */
export function normalizePlate(plate: string): string {
  return plate.replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

/**
 * Returns the Mercosul and Old variants of a plate if it's exactly 7 characters long.
 * Otherwise, returns the normalized plate as the single variant.
 */
export function getPlateVariants(plate: string): string[] {
  const clean = normalizePlate(plate);
  if (clean.length !== 7) {
    return [clean];
  }

  const char4 = clean[4];
  const mappingLetterToNumber: Record<string, string> = {
    'A': '0', 'B': '1', 'C': '2', 'D': '3', 'E': '4',
    'F': '5', 'G': '6', 'H': '7', 'I': '8', 'J': '9'
  };
  const mappingNumberToLetter: Record<string, string> = {
    '0': 'A', '1': 'B', '2': 'C', '3': 'D', '4': 'E',
    '5': 'F', '6': 'G', '7': 'H', '8': 'I', '9': 'J'
  };

  const variants = [clean];
  if (mappingLetterToNumber[char4] !== undefined) {
    const alternative = clean.substring(0, 4) + mappingLetterToNumber[char4] + clean.substring(5);
    variants.push(alternative);
  } else if (mappingNumberToLetter[char4] !== undefined) {
    const alternative = clean.substring(0, 4) + mappingNumberToLetter[char4] + clean.substring(5);
    variants.push(alternative);
  }
  return variants;
}

/**
 * Checks if a target plate (or any of its variants) matches a search query.
 */
export function plateMatchesSearch(targetPlate: string | undefined, searchQuery: string): boolean {
  if (!targetPlate) return false;
  const cleanQuery = normalizePlate(searchQuery);
  if (!cleanQuery) return true; // Empty search matches everything

  const variants = getPlateVariants(targetPlate);
  return variants.some(variant => variant.includes(cleanQuery));
}
