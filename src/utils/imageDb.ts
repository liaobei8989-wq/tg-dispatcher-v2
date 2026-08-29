// Lightweight IndexedDB & LocalStorage hybrid helper with auto-compression to bypass browser 5MB storage limits

const DB_NAME = 'TgHubImageStorage';
const DB_VERSION = 1;
const STORE_NAME = 'profile_photos';
const KEY_NAME = 'tg_uploaded_profile_images';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      if (!window.indexedDB) {
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
 * Compress and smart-crop an image file/base64 to lightweight 1:1 square borderless avatar (max 400x400, ~20-30KB)
 * Automatically trims screenshot borders, removes letterboxes, and centers the portrait cleanly
 */
export function compressImageToDataUrl(fileOrBase64: File | string, maxWidth = 400, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const origW = img.width;
        const origH = img.height;

        // Step 1: Draw to a temporary canvas to analyze borders
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = origW;
        tempCanvas.height = origH;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) {
          fallbackDraw(img, origW, origH, maxWidth, quality, resolve);
          return;
        }
        tempCtx.drawImage(img, 0, 0);
        const imgData = tempCtx.getImageData(0, 0, origW, origH).data;

        // Detect solid white / light-gray / black letterbox margins
        const isBorderColor = (r: number, g: number, b: number, a: number) => {
          if (a < 20) return true; // transparent
          const isWhite = r >= 235 && g >= 235 && b >= 235;
          const isBlack = r <= 18 && g <= 18 && b <= 18;
          return isWhite || isBlack;
        };

        let top = 0;
        let bottom = origH - 1;
        let left = 0;
        let right = origW - 1;

        // Top scan (max 25%)
        topLoop: for (let y = 0; y < origH * 0.25; y++) {
          for (let x = 0; x < origW; x++) {
            const idx = (y * origW + x) * 4;
            if (!isBorderColor(imgData[idx], imgData[idx + 1], imgData[idx + 2], imgData[idx + 3])) {
              top = Math.max(0, y);
              break topLoop;
            }
          }
        }

        // Bottom scan (max 25%)
        bottomLoop: for (let y = origH - 1; y > origH * 0.75; y--) {
          for (let x = 0; x < origW; x++) {
            const idx = (y * origW + x) * 4;
            if (!isBorderColor(imgData[idx], imgData[idx + 1], imgData[idx + 2], imgData[idx + 3])) {
              bottom = Math.min(origH - 1, y);
              break bottomLoop;
            }
          }
        }

        // Left scan (max 25%)
        leftLoop: for (let x = 0; x < origW * 0.25; x++) {
          for (let y = 0; y < origH; y++) {
            const idx = (y * origW + x) * 4;
            if (!isBorderColor(imgData[idx], imgData[idx + 1], imgData[idx + 2], imgData[idx + 3])) {
              left = Math.max(0, x);
              break leftLoop;
            }
          }
        }

        // Right scan (max 25%)
        rightLoop: for (let x = origW - 1; x > origW * 0.75; x--) {
          for (let y = 0; y < origH; y++) {
            const idx = (y * origW + x) * 4;
            if (!isBorderColor(imgData[idx], imgData[idx + 1], imgData[idx + 2], imgData[idx + 3])) {
              right = Math.min(origW - 1, x);
              break rightLoop;
            }
          }
        }

        const validW = Math.max(10, right - left + 1);
        const validH = Math.max(10, bottom - top + 1);

        // Center-crop to 1:1 square from the valid image area (focus on center-top for portraits)
        const squareSize = Math.min(validW, validH);
        const cropX = left + Math.round((validW - squareSize) / 2);
        // Slightly bias towards upper-center (portraits/faces) rather than dead center
        const cropY = top + Math.min(
          Math.max(0, Math.round((validH - squareSize) * 0.35)),
          validH - squareSize
        );

        const targetDim = Math.min(maxWidth, squareSize);
        const outCanvas = document.createElement('canvas');
        outCanvas.width = targetDim;
        outCanvas.height = targetDim;
        const outCtx = outCanvas.getContext('2d');
        if (!outCtx) {
          fallbackDraw(img, origW, origH, maxWidth, quality, resolve);
          return;
        }

        // Slight 2% zoom to guarantee 100% borderless bleed
        const inset = Math.round(squareSize * 0.02);
        const safeCropX = cropX + inset;
        const safeCropY = cropY + inset;
        const safeSquareSize = Math.max(10, squareSize - inset * 2);

        outCtx.drawImage(
          img,
          safeCropX,
          safeCropY,
          safeSquareSize,
          safeSquareSize,
          0,
          0,
          targetDim,
          targetDim
        );

        resolve(outCanvas.toDataURL('image/jpeg', quality));
      } catch (_) {
        fallbackDraw(img, img.width, img.height, maxWidth, quality, resolve);
      }
    };

    img.onerror = () => {
      resolve(typeof fileOrBase64 === 'string' ? fileOrBase64 : '');
    };

    if (typeof fileOrBase64 === 'string') {
      img.src = fileOrBase64;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(fileOrBase64);
    }
  });
}

function fallbackDraw(
  img: HTMLImageElement,
  origW: number,
  origH: number,
  maxWidth: number,
  quality: number,
  resolve: (val: string) => void
) {
  try {
    const size = Math.min(origW, origH);
    const targetSize = Math.min(maxWidth, size);
    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const offsetX = Math.round((origW - size) / 2);
      const offsetY = Math.round((origH - size) * 0.3);
      ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, targetSize, targetSize);
      resolve(canvas.toDataURL('image/jpeg', quality));
      return;
    }
  } catch (_) {}
  resolve(img.src);
}

/**
 * Batch compress an array of base64 images
 */
export async function batchCompressImages(images: string[], maxWidth = 400, quality = 0.72): Promise<string[]> {
  const tasks = images.map(img => compressImageToDataUrl(img, maxWidth, quality));
  return Promise.all(tasks);
}

/**
 * Save images array to IndexedDB (and sync to server disk in sessions/profile_avatars.json)
 */
export async function saveProfileImagesDB(images: string[]): Promise<{ success: boolean; compressedImages: string[] }> {
  // 1. First compress images to lightweight avatars (~15-25KB each)
  const compressedImages = await batchCompressImages(images, 400, 0.70);

  // 2. Sync to server hard disk asynchronously so photos are permanently saved in VPS sessions/profile_avatars.json
  try {
    fetch('/api/telegram/profile-avatars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: compressedImages })
    }).catch(e => console.warn('Server avatar sync background notice:', e));
  } catch (_) {}

  // 3. Try IndexedDB
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(compressedImages, KEY_NAME);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });

    try {
      localStorage.setItem('tg_uploaded_profile_images_count', String(compressedImages.length));
    } catch (_) {}

    return { success: true, compressedImages };
  } catch (err) {
    console.warn('IndexedDB save failed, switching to compressed LocalStorage fallback:', err);
  }

  // 4. LocalStorage Fallback with compressed images
  try {
    localStorage.setItem(KEY_NAME, JSON.stringify(compressedImages));
    localStorage.setItem('tg_uploaded_profile_images_count', String(compressedImages.length));
    return { success: true, compressedImages };
  } catch (e) {
    console.warn('LocalStorage quota limit reached, attempting ultra-compression (300px, 0.5 quality):', e);
  }

  // 5. Ultra-compression emergency fallback
  try {
    const ultraCompressed = await batchCompressImages(images, 300, 0.50);
    localStorage.setItem(KEY_NAME, JSON.stringify(ultraCompressed));
    localStorage.setItem('tg_uploaded_profile_images_count', String(ultraCompressed.length));
    return { success: true, compressedImages: ultraCompressed };
  } catch (err: any) {
    console.error('All storage options failed:', err);
    throw new Error(`存储受限: ${err?.message || '请尝试删除部分照片后重新保存'}`);
  }
}

/**
 * Load images array from server disk (or fallback to IndexedDB / localStorage)
 */
export async function loadProfileImagesDB(): Promise<string[]> {
  // 1. First attempt to load from server disk (/api/telegram/profile-avatars)
  try {
    const resp = await fetch('/api/telegram/profile-avatars');
    if (resp.ok) {
      const data = await resp.json();
      if (data && data.success && Array.isArray(data.images) && data.images.length > 0) {
        // Also cache into local IndexedDB
        try {
          const db = await openDB();
          const tx = db.transaction(STORE_NAME, 'readwrite');
          tx.objectStore(STORE_NAME).put(data.images, KEY_NAME);
        } catch (_) {}
        return data.images;
      }
    }
  } catch (err) {
    console.warn('Failed to load avatars from server disk, falling back to local DB:', err);
  }

  // 2. Try IndexedDB
  try {
    const db = await openDB();
    const imgs = await new Promise<string[]>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(KEY_NAME);
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

    if (imgs.length > 0) {
      // Auto sync local images to server so they become permanently stored on the VPS disk
      fetch('/api/telegram/profile-avatars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: imgs })
      }).catch(() => {});
      return imgs;
    }
  } catch (err) {
    console.warn('IndexedDB load failed:', err);
  }

  // 3. Check localStorage fallback
  const legacy = localStorage.getItem(KEY_NAME);
  if (legacy) {
    try {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed) && parsed.length > 0) {
        fetch('/api/telegram/profile-avatars', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: parsed })
        }).catch(() => {});
        return parsed;
      }
    } catch (_) {}
  }
  return [];
}

/**
 * Compute comprehensive perceptual image features:
 * 1. 16x16 RGB color matrix (768 values) for direct pixel color distance
 * 2. 8x8 dHash (64-bit gradient difference hash)
 * 3. 8x8 aHash (64-bit average hash)
 * 4. 16-bin color distribution histogram
 */
interface ImageFeatures {
  rgbMatrix: number[]; // 16x16x3 = 768 color values (0-255)
  dHash: string; // 64-bit difference hash
  aHash: string; // 64-bit average hash
  colorHistogram: number[]; // 16-bin histogram
  aspectRatio: number;
}

function loadImageElement(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

/**
 * Extract perceptual hash and visual features from an image
 */
export async function extractImageFeatures(dataUrl: string): Promise<ImageFeatures> {
  try {
    const img = await loadImageElement(dataUrl);
    const aspect = (img.naturalWidth || img.width || 1) / (img.naturalHeight || img.height || 1);

    // 1. 16x16 RGB Matrix & Color Histogram
    const canvas16 = document.createElement('canvas');
    canvas16.width = 16;
    canvas16.height = 16;
    const ctx16 = canvas16.getContext('2d', { willReadFrequently: true });
    
    const rgbMatrix: number[] = [];
    const colorHistogram = new Array(16).fill(0);
    let dHash = '';
    let aHash = '';

    if (ctx16) {
      ctx16.drawImage(img, 0, 0, 16, 16);
      const imgData = ctx16.getImageData(0, 0, 16, 16).data;
      
      let totalGray = 0;
      const grays: number[] = [];

      for (let i = 0; i < imgData.length; i += 4) {
        const r = imgData[i];
        const g = imgData[i + 1];
        const b = imgData[i + 2];
        rgbMatrix.push(r, g, b);

        const gray = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
        grays.push(gray);
        totalGray += gray;

        // 16-bin histogram
        const bin = Math.min(15, Math.floor(gray / 16));
        colorHistogram[bin]++;
      }

      // aHash on 16x16 -> downsampled to 8x8 center
      const avgGray = totalGray / (grays.length || 1);
      for (let i = 0; i < 64; i++) {
        const x = 4 + (i % 8);
        const y = 4 + Math.floor(i / 8);
        const idx = y * 16 + x;
        aHash += (grays[idx] || 0) >= avgGray ? '1' : '0';
      }
    }

    // 2. 9x8 dHash (Difference Hash)
    const dCanvas = document.createElement('canvas');
    dCanvas.width = 9;
    dCanvas.height = 8;
    const dCtx = dCanvas.getContext('2d', { willReadFrequently: true });
    if (dCtx) {
      dCtx.drawImage(img, 0, 0, 9, 8);
      const dData = dCtx.getImageData(0, 0, 9, 8).data;
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const leftIdx = (y * 9 + x) * 4;
          const rightIdx = (y * 9 + (x + 1)) * 4;
          const leftGray = dData[leftIdx] * 0.299 + dData[leftIdx + 1] * 0.587 + dData[leftIdx + 2] * 0.114;
          const rightGray = dData[rightIdx] * 0.299 + dData[rightIdx + 1] * 0.587 + dData[rightIdx + 2] * 0.114;
          dHash += leftGray > rightGray ? '1' : '0';
        }
      }
    }

    return {
      rgbMatrix,
      dHash: dHash || '0'.repeat(64),
      aHash: aHash || '0'.repeat(64),
      colorHistogram,
      aspectRatio: aspect
    };
  } catch (_) {
    return {
      rgbMatrix: [],
      dHash: dataUrl.slice(0, 64),
      aHash: dataUrl.slice(64, 128),
      colorHistogram: [],
      aspectRatio: 1
    };
  }
}

/**
 * Calculate Hamming distance between two binary hash strings
 */
function hammingDistance(hash1: string, hash2: string): number {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) return 999;
  let dist = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) dist++;
  }
  return dist;
}

/**
 * Calculate Mean Absolute Error (MAE) between two RGB color matrices (0 to 255)
 */
function calculateRGBMatrixMAE(matA: number[], matB: number[]): number {
  if (!matA.length || !matB.length || matA.length !== matB.length) return 999;
  let sum = 0;
  for (let i = 0; i < matA.length; i++) {
    sum += Math.abs(matA[i] - matB[i]);
  }
  return sum / matA.length;
}

/**
 * Check if two images are visually duplicate or highly identical
 */
export function areImagesDuplicate(featA: ImageFeatures, featB: ImageFeatures): boolean {
  // 1. Direct 16x16 RGB Mean Absolute Error (MAE)
  if (featA.rgbMatrix.length > 0 && featB.rgbMatrix.length > 0) {
    const mae = calculateRGBMatrixMAE(featA.rgbMatrix, featB.rgbMatrix);
    // Extremely confident match: MAE <= 25 (out of 255)
    if (mae <= 25) return true;
    // Highly confident match with relaxed threshold if aspect ratio is close
    if (mae <= 34) {
      const dDist = hammingDistance(featA.dHash, featB.dHash);
      const aDist = hammingDistance(featA.aHash, featB.aHash);
      if (dDist <= 15 || aDist <= 14) return true;
    }
  }

  // 2. dHash difference
  const dDist = hammingDistance(featA.dHash, featB.dHash);
  if (dDist <= 9) return true;

  // 3. aHash difference
  const aDist = hammingDistance(featA.aHash, featB.aHash);
  if (aDist <= 7) return true;

  // 4. Combined hash threshold
  if (dDist <= 13 && aDist <= 11) return true;

  return false;
}

/**
 * Compute a fast visual perceptual fingerprint for an image data URL (compatibility export)
 */
export async function computeImageFingerprint(dataUrl: string): Promise<string> {
  const feat = await extractImageFeatures(dataUrl);
  return `${feat.dHash}_${feat.aHash}`;
}

/**
 * Deduplicate an array of images based on perceptual visual hashing & RGB color similarity
 */
export async function deduplicateImages(
  images: string[]
): Promise<{ uniqueImages: string[]; removedCount: number }> {
  if (images.length <= 1) {
    return { uniqueImages: images, removedCount: 0 };
  }

  // Filter out invalid or empty entries
  const validImages = images.filter(img => img && typeof img === 'string' && img.trim().length > 20);

  // 1. First pass: exact string deduplication
  const exactSet = new Set<string>();
  const exactDeduplicated: string[] = [];
  for (const img of validImages) {
    if (!exactSet.has(img)) {
      exactSet.add(img);
      exactDeduplicated.push(img);
    }
  }

  // 2. Second pass: Extract visual perceptual features for all images concurrently
  const featuresList = await Promise.all(
    exactDeduplicated.map(img => extractImageFeatures(img))
  );

  // 3. Compare images pairwise using perceptual hash & RGB color distance
  const uniqueImages: string[] = [];
  const uniqueFeatures: ImageFeatures[] = [];

  for (let i = 0; i < exactDeduplicated.length; i++) {
    const currentImg = exactDeduplicated[i];
    const currentFeat = featuresList[i];

    let isDup = false;
    for (let j = 0; j < uniqueFeatures.length; j++) {
      if (areImagesDuplicate(currentFeat, uniqueFeatures[j])) {
        isDup = true;
        break;
      }
    }

    if (!isDup) {
      uniqueImages.push(currentImg);
      uniqueFeatures.push(currentFeat);
    }
  }

  const removedCount = images.length - uniqueImages.length;
  return { uniqueImages, removedCount };
}

/**
 * Automatically remove white/black screenshot letterboxing & center face/photo
 */
export async function trimImageWhiteBorders(dataUrl: string, maxWidth = 400): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const origW = img.width;
        const origH = img.height;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = origW;
        tempCanvas.height = origH;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) {
          resolve(dataUrl);
          return;
        }
        tempCtx.drawImage(img, 0, 0);
        const imgData = tempCtx.getImageData(0, 0, origW, origH).data;

        // Find non-white / non-black content bounding box
        let top = 0;
        let bottom = origH - 1;
        let left = 0;
        let right = origW - 1;

        const isBorderColor = (r: number, g: number, b: number) => {
          const isWhite = r >= 242 && g >= 242 && b >= 242;
          const isBlack = r <= 15 && g <= 15 && b <= 15;
          return isWhite || isBlack;
        };

        // Scan top
        topLoop: for (let y = 0; y < origH * 0.35; y++) {
          for (let x = 0; x < origW; x++) {
            const idx = (y * origW + x) * 4;
            if (!isBorderColor(imgData[idx], imgData[idx + 1], imgData[idx + 2])) {
              top = Math.max(0, y - 2);
              break topLoop;
            }
          }
        }

        // Scan bottom
        bottomLoop: for (let y = origH - 1; y > origH * 0.65; y--) {
          for (let x = 0; x < origW; x++) {
            const idx = (y * origW + x) * 4;
            if (!isBorderColor(imgData[idx], imgData[idx + 1], imgData[idx + 2])) {
              bottom = Math.min(origH - 1, y + 2);
              break bottomLoop;
            }
          }
        }

        // Scan left
        leftLoop: for (let x = 0; x < origW * 0.35; x++) {
          for (let y = 0; y < origH; y++) {
            const idx = (y * origW + x) * 4;
            if (!isBorderColor(imgData[idx], imgData[idx + 1], imgData[idx + 2])) {
              left = Math.max(0, x - 2);
              break leftLoop;
            }
          }
        }

        // Scan right
        rightLoop: for (let x = origW - 1; x > origW * 0.65; x--) {
          for (let y = 0; y < origH; y++) {
            const idx = (y * origW + x) * 4;
            if (!isBorderColor(imgData[idx], imgData[idx + 1], imgData[idx + 2])) {
              right = Math.min(origW - 1, x + 2);
              break rightLoop;
            }
          }
        }

        const cropW = Math.max(10, right - left + 1);
        const cropH = Math.max(10, bottom - top + 1);

        let finalW = cropW;
        let finalH = cropH;
        if (finalW > maxWidth) {
          finalH = Math.round((finalH * maxWidth) / finalW);
          finalW = maxWidth;
        }

        const outCanvas = document.createElement('canvas');
        outCanvas.width = finalW;
        outCanvas.height = finalH;
        const outCtx = outCanvas.getContext('2d');
        if (!outCtx) {
          resolve(dataUrl);
          return;
        }
        outCtx.fillStyle = '#FFFFFF';
        outCtx.fillRect(0, 0, finalW, finalH);
        outCtx.drawImage(img, left, top, cropW, cropH, 0, 0, finalW, finalH);
        resolve(outCanvas.toDataURL('image/jpeg', 0.8));
      } catch (_) {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Clear profile images from IndexedDB, LocalStorage & Server Disk
 */
export async function clearProfileImagesDB(): Promise<void> {
  try {
    fetch('/api/telegram/profile-avatars', { method: 'DELETE' }).catch(() => {});
  } catch (_) {}
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(KEY_NAME);
  } catch (_) {}
  localStorage.removeItem(KEY_NAME);
  localStorage.removeItem('tg_uploaded_profile_images_count');
}
