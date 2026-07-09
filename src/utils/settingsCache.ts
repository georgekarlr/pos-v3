import { BusinessSettings } from '../types/settings';

const SECRET_KEY = 'antigravity-pos-secure-key-2026';
const CACHE_KEY = 'cached_business_settings';

// Encrypt string with a simple, secure UTF-8 friendly XOR cipher
export function encrypt(text: string): string {
  const enc = Array.from(text).map((char, i) => {
    const keyChar = SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
    return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
  }).join('');
  return btoa(unescape(encodeURIComponent(enc)));
}

// Decrypt string with XOR cipher
export function decrypt(encoded: string): string {
  try {
    const decoded = decodeURIComponent(escape(atob(encoded)));
    return Array.from(decoded).map((char, i) => {
      const keyChar = SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
    }).join('');
  } catch (e) {
    console.error('Failed to decrypt settings data:', e);
    return '';
  }
}

// Check if settings represent an expired subscription
export function isSubscriptionExpired(settings: BusinessSettings | null | undefined): boolean {
  if (!settings) return false;

  // Check subscription status
  if (settings.subscription_status?.toLowerCase() === 'expired') {
    return true;
  }

  // Check expiry date in the past
  if (settings.expiry_date) {
    try {
      const expiry = new Date(settings.expiry_date);
      if (!isNaN(expiry.getTime()) && expiry.getTime() < Date.now()) {
        return true;
      }
    } catch (e) {
      console.error('Error parsing expiry date:', e);
    }
  }

  return false;
}

// Save business settings to cache with encryption
export function saveCachedBusinessSettings(settings: BusinessSettings): void {
  try {
    const serialized = JSON.stringify(settings);
    const encrypted = encrypt(serialized);
    localStorage.setItem(CACHE_KEY, encrypted);
  } catch (e) {
    console.error('Error saving encrypted business settings to cache:', e);
  }
}

// Retrieve business settings from cache with decryption
// Will return null if expired or if decryption/parsing fails
export function getCachedBusinessSettings(ignoreExpiryCheck = false): BusinessSettings | null {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return null;

    // Check if it's stored as plain JSON (backward compatibility migration)
    let parsed: BusinessSettings | null = null;
    if (stored.trim().startsWith('{')) {
      parsed = JSON.parse(stored);
      // Migrate to encrypted format
      if (parsed) {
        saveCachedBusinessSettings(parsed);
      }
    } else {
      const decrypted = decrypt(stored);
      if (decrypted) {
        parsed = JSON.parse(decrypted);
      }
    }

    if (parsed) {
      // Correctly derive is_vat_registered from billing_type
      parsed.is_vat_registered = parsed.billing_type === 'VAT';

      // Enforce expired check unless explicitly ignored (e.g. on settings page)
      if (!ignoreExpiryCheck && isSubscriptionExpired(parsed)) {
        console.warn('Subscription has expired. Access to cached settings denied.');
        return null;
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error reading decrypted business settings from cache:', e);
  }
  return null;
}
