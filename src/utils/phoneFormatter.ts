/**
 * Utility functions for formatting and displaying phone numbers for services and clients.
 */
import { Client } from '../types';

/**
 * Standard phone input formatter.
 * Automatically inserts parentheses, spaces, and hyphens as the user types digits.
 * Standard format requested: (99)9 9999-9999
 */
export function formatPhoneInput(value: string): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  // If 10 digits and not starting with 9 (traditional landline)
  if (digits.length === 10 && digits[2] !== '9') {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 3) {
    return `(${digits.slice(0, 2)})${digits.slice(2)}`;
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)})${digits.slice(2, 3)} ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 2)})${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
}

/**
 * Resolves the phone number for a service:
 * 1. Uses service's explicit phone if available.
 * 2. If not, looks up client in registered clients list.
 * 3. If still empty, returns 'ninfo'.
 */
export function resolveServicePhone(phone?: string, clientName?: string, clients?: Client[]): string {
  const p = (phone || '').trim();
  if (p && p.toLowerCase() !== 'ninfo') {
    return formatPhoneInput(p) || p;
  }

  if (clientName && clients && clients.length > 0) {
    const matched = clients.find(c => c.name.trim().toLowerCase() === clientName.trim().toLowerCase());
    if (matched && matched.phone && matched.phone.trim() && matched.phone.trim().toLowerCase() !== 'ninfo') {
      return formatPhoneInput(matched.phone) || matched.phone.trim();
    }
  }

  return 'ninfo';
}

/**
 * Returns formatted "Nome_do_cliente número_de_telefone", e.g. "João Silva (27)9 9999-9999" or "João Silva ninfo"
 */
export function getClientWithPhone(clientName?: string, phone?: string, clients?: Client[]): string {
  const name = (clientName || '').trim() || 'CLIENTE NÃO INFORMADO';
  const resolvedPhone = resolveServicePhone(phone, name, clients);
  return `${name} ${resolvedPhone}`;
}
