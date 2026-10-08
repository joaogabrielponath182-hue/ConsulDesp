/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */
import { plateMatchesSearch } from './plateMatcher';

/**
 * Normalizes text for case-insensitive and accent-insensitive exact substring search.
 * e.g. "Irineo" -> "irineo", "IRINEO" -> "irineo", "José" -> "jose"
 */
export function normalizeSearchText(text?: string | null): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Checks if target string contains the search query as an exact substring.
 * Case-insensitive & accent-insensitive.
 * e.g. target "Irineo da Silva", query "irineo" -> true
 *      target "Irineo da Silva", query "IRINEO" -> true
 *      target "Irineo da Silva", query "iirneo" -> false
 */
export function textMatchesExact(target?: string | null, query?: string | null): boolean {
  if (!query || !query.trim()) return true;
  if (!target || typeof target !== 'string') return false;
  
  const cleanTarget = normalizeSearchText(target);
  const cleanQuery = normalizeSearchText(query);
  
  if (!cleanQuery) return true;
  return cleanTarget.includes(cleanQuery);
}

/**
 * Checks if a service matches the report text search.
 * Strictly searches ONLY: PLACA, DESCRIÇÃO or NOME (client).
 * Case-insensitive & accent-insensitive exact matching.
 */
export function serviceMatchesReportSearch(
  service: { plate?: string | null; description?: string | null; client?: string | null },
  query?: string | null
): boolean {
  if (!query || !query.trim()) return true;
  const trimmed = query.trim();

  // 1. PLACA
  if (plateMatchesSearch(service.plate, trimmed)) {
    return true;
  }

  // 2. NOME (Cliente)
  if (textMatchesExact(service.client, trimmed)) {
    return true;
  }

  // 3. DESCRIÇÃO
  if (textMatchesExact(service.description, trimmed)) {
    return true;
  }

  return false;
}

/**
 * Checks if an expense matches the report text search.
 * Strictly searches ONLY: PLACA or DESCRIÇÃO.
 */
export function expenseMatchesReportSearch(
  expense: { plate?: string | null; description?: string | null; items?: Array<{ plate?: string | null }> },
  query?: string | null
): boolean {
  if (!query || !query.trim()) return true;
  const trimmed = query.trim();

  // 1. PLACA (main plate or items plate)
  if (plateMatchesSearch(expense.plate, trimmed)) {
    return true;
  }
  if (expense.items && expense.items.some(it => plateMatchesSearch(it.plate, trimmed))) {
    return true;
  }

  // 2. DESCRIÇÃO
  if (textMatchesExact(expense.description, trimmed)) {
    return true;
  }

  return false;
}
