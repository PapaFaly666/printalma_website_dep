/**
 * Utilitaires pour la compression et la gestion des images personnalisées
 * Permet de réduire la taille des images pour le stockage localStorage et IndexedDB
 */

export interface CompressedImage {
  compressedDataUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
}

export interface ImageCacheEntry {
  id: string;
  compressedDataUrl: string;
  originalSize: number;
  compressedSize: number;
  timestamp: number;
  lastAccessed: number;
}

/**
 * Compresse une image avec qualité ajustable
 * @param file - Fichier image à compresser
 * @param maxWidth - Largeur maximale (défaut: 1920)
 * @param maxHeight - Hauteur maximale (défaut: 1080)
 * @param quality - Qualité de compression (0.1 à 1.0, défaut: 0.8)
 * @returns Promise<CompressedImage> - Image compressée avec métadonnées
 */
export const compressImage = async (
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<CompressedImage> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Impossible de créer le contexte 2D'));
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        // Calculer les nouvelles dimensions en conservant le ratio
        const { width, height } = calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        );

        canvas.width = width;
        canvas.height = height;

        // Détecter si l'image a de la transparence (PNG)
        const hasTransparency = file.type === 'image/png';

        if (hasTransparency) {
          // Pour les PNG, préserver la transparence
          ctx.clearRect(0, 0, width, height);
        } else {
          // Pour les autres formats, utiliser un fond blanc
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        // Dessiner l'image compressée
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir en dataURL en préservant le format original
        const outputFormat = hasTransparency ? 'image/png' : 'image/jpeg';
        const outputQuality = hasTransparency ? undefined : quality; // PNG n'utilise pas la qualité
        const compressedDataUrl = canvas.toDataURL(outputFormat, outputQuality);

        // Calculer les tailles
        const originalSize = file.size;
        const compressedSize = Math.round(compressedDataUrl.length * 0.75); // Approximation base64
        const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);

        resolve({
          compressedDataUrl,
          originalSize,
          compressedSize,
          compressionRatio,
          width,
          height
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Impossible de charger l\'image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Calcule les dimensions optimales en conservant le ratio d'aspect
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  // Si l'image est déjà assez petite, retourner les dimensions originales
  if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
    return { width: originalWidth, height: originalHeight };
  }

  // Calculer le ratio
  const widthRatio = maxWidth / originalWidth;
  const heightRatio = maxHeight / originalHeight;
  const ratio = Math.min(widthRatio, heightRatio);

  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio)
  };
}

/**
 * Vérifie si une chaîne base64 est trop grande pour localStorage
 */
export const isTooLargeForLocalStorage = (dataUrl: string): boolean => {
  // Limite conservative : 4MB (la plupart des navigateurs limitent à 5-10MB)
  const sizeInBytes = Math.round(dataUrl.length * 0.75);
  return sizeInBytes > 4 * 1024 * 1024;
};

/**
 * Service de cache d'images avec IndexedDB
 */
class ImageCacheService {
  private dbName = 'PrintAlmaImageCache';
  private storeName = 'images';
  private db: IDBDatabase | null = null;
  private readonly maxCacheSize = 50 * 1024 * 1024; // 50MB
  private readonly maxAge = 30 * 24 * 60 * 60 * 1000; // 30 jours

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        }
      };
    });
  }

  async storeImage(id: string, compressedImage: CompressedImage): Promise<void> {
    await this.init();

    if (!this.db) throw new Error('Base de données non initialisée');

    // Nettoyer le cache si nécessaire
    await this.cleanupCache();

    const entry: ImageCacheEntry = {
      id,
      compressedDataUrl: compressedImage.compressedDataUrl,
      originalSize: compressedImage.originalSize,
      compressedSize: compressedImage.compressedSize,
      timestamp: Date.now(),
      lastAccessed: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const request = store.put(entry);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getImage(id: string): Promise<ImageCacheEntry | null> {
    await this.init();

    if (!this.db) throw new Error('Base de données non initialisée');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const entry = request.result;
        if (entry) {
          // Mettre à jour lastAccessed
          entry.lastAccessed = Date.now();
          store.put(entry);
        }
        resolve(entry || null);
      };
    });
  }

  async removeImage(id: string): Promise<void> {
    await this.init();

    if (!this.db) throw new Error('Base de données non initialisée');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async cleanupCache(): Promise<void> {
    const transaction = this.db!.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    // Supprimer les entrées trop anciennes
    const cutoffTime = Date.now() - this.maxAge;
    const oldIndex = store.index('timestamp');
    const oldRequest = oldIndex.openCursor(IDBKeyRange.upperBound(cutoffTime));

    oldRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    // Si le cache est trop plein, supprimer les plus anciennes
    const sizeRequest = store.getAll();
    sizeRequest.onsuccess = async () => {
      const entries = sizeRequest.result;
      const totalSize = entries.reduce((sum: number, entry: ImageCacheEntry) =>
        sum + entry.compressedSize, 0);

      if (totalSize > this.maxCacheSize) {
        // Trier par lastAccessed et supprimer les plus anciens
        entries.sort((a: ImageCacheEntry, b: ImageCacheEntry) =>
          a.lastAccessed - b.lastAccessed);

        const toDelete = entries.slice(0, Math.ceil(entries.length * 0.2)); // Supprimer 20% des plus anciens
        for (const entry of toDelete) {
          await this.removeImage(entry.id);
        }
      }
    };
  }

  async clearCache(): Promise<void> {
    await this.init();

    if (!this.db) throw new Error('Base de données non initialisée');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export const imageCache = new ImageCacheService();

/**
 * Fonction utilitaire pour traiter une image uploadée
 * Compresse l'image et la stocke dans le cache si nécessaire
 */
export const processUploadedImage = async (
  file: File,
  imageId: string,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  }
): Promise<CompressedImage> => {
  try {
    // Compresser l'image
    const compressed = await compressImage(
      file,
      options?.maxWidth,
      options?.maxHeight,
      options?.quality
    );

    console.log('🗜️ [ImageCompression] Image compressée:', {
      originalSize: formatFileSize(compressed.originalSize),
      compressedSize: formatFileSize(compressed.compressedSize),
      compressionRatio: `${compressed.compressionRatio}%`,
      dimensions: `${compressed.width}x${compressed.height}`
    });

    // Si l'image est encore trop grande pour localStorage, utiliser IndexedDB
    if (isTooLargeForLocalStorage(compressed.compressedDataUrl)) {
      console.log('💾 [ImageCompression] Stockage dans IndexedDB (trop grand pour localStorage)');
      await imageCache.storeImage(imageId, compressed);
    }

    return compressed;
  } catch (error) {
    console.error('❌ [ImageCompression] Erreur lors du traitement de l\'image:', error);
    throw error;
  }
};

/**
 * Récupère une image depuis le cache ou localStorage
 */
export const getStoredImage = async (imageId: string, localStorageDataUrl?: string): Promise<string | null> => {
  // D'abord essayer localStorage
  if (localStorageDataUrl) {
    return localStorageDataUrl;
  }

  // Sinon essayer IndexedDB
  try {
    const cached = await imageCache.getImage(imageId);
    if (cached) {
      return cached.compressedDataUrl;
    }
  } catch (error) {
    console.error('❌ [ImageCompression] Erreur lors de la récupération depuis IndexedDB:', error);
  }

  return null;
};

/**
 * Formate une taille en octets pour l'affichage
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}