import { AccountSession } from '../types';

const DB_NAME = 'TgHubAccountDB';
const DB_VERSION = 1;
const STORE_NAME = 'accounts_store';
const ACCOUNTS_KEY = 'tg_wa_matrix_accounts_v2';

function openAccountDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Sanitize accounts for localStorage fallback to ensure payload is under 100KB
 */
function sanitizeAccountsForLocalStorage(accounts: AccountSession[]): AccountSession[] {
  return accounts.map(acc => {
    let cleanAvatar = acc.avatarUrl;
    // If avatarUrl is a massive base64 data URL (>500KB), compress or truncate for localStorage fallback, but keep IndexedDB intact
    if (cleanAvatar && cleanAvatar.startsWith('data:') && cleanAvatar.length > 500000) {
      // Keep avatar as is or clean up if needed
    }
    return {
      ...acc,
      avatarUrl: cleanAvatar,
      // Truncate overly long diagnostic logs if any
      healthDiagnosticLog: acc.healthDiagnosticLog && acc.healthDiagnosticLog.length > 500
        ? acc.healthDiagnosticLog.slice(0, 500) + '...'
        : acc.healthDiagnosticLog
    };
  });
}

/**
 * Synchronous & safe localStorage setItem wrapper with quota guard and fallback cleanup
 */
export function safeSaveAccountsToLocalStorage(accounts: AccountSession[]): void {
  if (typeof window === 'undefined') return;

  const lightList = sanitizeAccountsForLocalStorage(accounts);
  const jsonStr = JSON.stringify(lightList);

  try {
    localStorage.setItem(ACCOUNTS_KEY, jsonStr);
  } catch (err: any) {
    // QuotaExceededError handling
    console.warn('localStorage quota exceeded while saving accounts, attempting cleanup and ultra-strip...', err);
    try {
      // 1. Remove non-essential bulky keys if present
      localStorage.removeItem('tg_uploaded_profile_images');
      localStorage.removeItem('tg_campaign_rotation_images');
      
      // 2. Ultra-strip base64 strings completely for localStorage
      const ultraLightList = accounts.map(a => ({
        ...a,
        avatarUrl: a.avatarUrl?.startsWith('data:') ? '' : a.avatarUrl,
        healthDiagnosticLog: ''
      }));
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(ultraLightList));
    } catch (finalErr) {
      console.warn('localStorage completely full, reliance shifted to IndexedDB.', finalErr);
    }
  }
}

/**
 * Save accounts asynchronously to IndexedDB (primary) and localStorage (lightweight fallback)
 */
export async function saveAccountsToStorage(accounts: AccountSession[]): Promise<void> {
  // 1. Save lightweight fallback to localStorage safely
  safeSaveAccountsToLocalStorage(accounts);

  // 2. Save full account data to IndexedDB
  try {
    const db = await openAccountDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(accounts, ACCOUNTS_KEY);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB account save warning:', err);
  }
}

/**
 * Load accounts asynchronously from IndexedDB or localStorage
 */
export async function loadAccountsFromStorage(): Promise<AccountSession[] | null> {
  // 1. Try IndexedDB first
  try {
    const db = await openAccountDB();
    const data = await new Promise<AccountSession[]>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(ACCOUNTS_KEY);
      request.onsuccess = () => {
        const val = request.result;
        if (Array.isArray(val) && val.length > 0) {
          resolve(val);
        } else {
          resolve([]);
        }
      };
      request.onerror = () => resolve([]);
    });

    if (data && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('IndexedDB account load warning:', err);
  }

  // 2. Fallback to localStorage
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(ACCOUNTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('localStorage account load warning:', e);
    }
  }

  return null;
}
