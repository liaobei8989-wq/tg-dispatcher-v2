import { MediaAsset } from '../types';

const DB_NAME = 'TgWsMediaAssetStorage';
const DB_VERSION = 1;
const STORE_NAME = 'user_media_assets';
const LOCALSTORAGE_KEY = 'user_custom_media_assets';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Compress image before saving to optimize storage footprint
 */
export function compressImageForStorage(fileOrDataUrl: File | string, maxWidth = 1000, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.length < 50000) {
      resolve(fileOrDataUrl);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(width, 1);
      canvas.height = Math.max(height, 1);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } else {
        resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : img.src);
      }
    };

    img.onerror = () => {
      resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
    };

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}

/**
 * Load user custom media assets asynchronously from IndexedDB, falling back to localStorage
 */
export async function loadCustomMediaAssets(): Promise<MediaAsset[]> {
  try {
    const db = await openDB();
    const assets: MediaAsset[] = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    if (assets && assets.length > 0) {
      return assets;
    }
  } catch (e) {
    console.warn('IndexedDB load media assets error, checking localStorage fallback...', e);
  }

  // Fallback to localStorage if IndexedDB had no records or failed
  try {
    const saved = localStorage.getItem(LOCALSTORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Migrate to IndexedDB for safety
        saveCustomMediaAssets(parsed).catch(() => {});
        return parsed;
      }
    }
  } catch (e) {
    console.warn('localStorage fallback load error:', e);
  }

  return [];
}

/**
 * Save user custom media assets asynchronously to IndexedDB (primary) and localStorage (quota-guarded fallback)
 */
export async function saveCustomMediaAssets(assets: MediaAsset[]): Promise<void> {
  // 1. Primary storage: IndexedDB (supports large storage up to multi-GBs)
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    for (const item of assets) {
      store.put(item);
    }
  } catch (e) {
    console.error('Failed to save media assets to IndexedDB:', e);
  }

  // 2. Secondary storage: localStorage (safely guarded with try...catch to prevent QuotaExceededError crashes)
  try {
    const jsonStr = JSON.stringify(assets);
    if (jsonStr.length < 1500000) {
      localStorage.setItem(LOCALSTORAGE_KEY, jsonStr);
    } else {
      // Store lightweight list if too large
      const lightweight = assets.map((a) => ({
        ...a,
        url: a.url.startsWith('data:') && a.url.length > 100000 ? '' : a.url
      }));
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(lightweight));
    }
  } catch (err) {
    console.warn('localStorage quota reached for media assets. Reliably using IndexedDB instead.', err);
    try {
      localStorage.removeItem(LOCALSTORAGE_KEY);
    } catch (_) {}
  }
}
