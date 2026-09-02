/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formata datas no formato padrão brasileiro (DD-MM-AAAA ou DD/MM/AAAA)
 * Ex: "2026-08-25" -> "25-08-2026"
 */
export function formatDateBR(dateStr?: string | null, separator: '-' | '/' = '-'): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}${separator}${parts[1]}${separator}${parts[0]}`;
    }
  }
  return trimmed;
}
