/**
 * terminalStorage.ts
 *
 * Secure localStorage helpers for the selected POS terminal ID.
 * The value is encrypted at rest using the same XOR+Base64 cipher
 * already used by settingsCache.ts.
 *
 * Backward-compatible: if a plain numeric string is found in storage
 * (written before this migration) it is silently re-saved as encrypted.
 */

import { encrypt, decrypt } from './settingsCache';

const STORAGE_KEY = 'selected_pos_terminal_id';

/**
 * Persist the selected terminal ID to localStorage (encrypted).
 * Pass `null` to remove the entry.
 */
export function saveTerminalId(id: number | null): void {
  if (id === null || id === undefined) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  try {
    const encrypted = encrypt(id.toString());
    localStorage.setItem(STORAGE_KEY, encrypted);
  } catch (e) {
    console.error('[terminalStorage] Failed to encrypt terminal ID:', e);
  }
}

/**
 * Read the selected terminal ID from localStorage.
 * Returns `null` when not set or when decryption/parsing fails.
 */
export function getTerminalId(): number | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    let raw: string;

    // Backward-compatibility: plain numeric string written before encryption
    if (/^\d+$/.test(stored.trim())) {
      raw = stored.trim();
      // Migrate to encrypted form immediately
      saveTerminalId(Number(raw));
    } else {
      raw = decrypt(stored);
    }

    const id = Number(raw);
    return isNaN(id) || id <= 0 ? null : id;
  } catch (e) {
    console.error('[terminalStorage] Failed to decrypt terminal ID:', e);
    return null;
  }
}

/**
 * Remove the terminal ID from localStorage.
 */
export function clearTerminalId(): void {
  localStorage.removeItem(STORAGE_KEY);
}
