import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3004';
const STOCK_STORAGE_KEY = 'printalma_product_stocks';

// 🔄 Mode de gestion des stocks
// - 'localStorage': Gestion frontend uniquement (actuel)
// - 'api': Gestion via backend (recommandé pour production)
// - 'hybrid': Les deux (migration progressive)
const STOCK_MODE: 'localStorage' | 'api' | 'hybrid' = 'api';

export interface ProductStock {
  id: number;
  name: string;
  category?: string;
  subcategory?: string;
  mainImage?: string;
  totalStock: number;
  colorVariations: ColorVariation[];
}

export interface ColorVariation {
  id: number;
  name: string;
  colorCode: string;
  images: ColorImage[];
  sizes: SizeStock[];
}

export interface ColorImage {
  id: number;
  url: string;
  view: string;
}

export interface SizeStock {
  id: number;
  sizeName: string;
  stock: number;
}

// Types pour l'historique de stock
export type StockMovementType = 'IN' | 'OUT';

export interface StockMovement {
  id: number;
  productId: number;
  productName: string;
  colorId: number;
  colorName: string;
  sizeName: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
  createdAt: string;
  createdBy?: string;
}

// Structure pour stocker les stocks en localStorage
interface StockData {
  [productId: number]: {
    [colorId: number]: {
      [sizeId: number]: number; // stock
    };
  };
}

/**
 * Charger les stocks depuis le localStorage
 */
const loadStocksFromLocalStorage = (): StockData => {
  try {
    const stored = localStorage.getItem(STOCK_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading stocks from localStorage:', error);
    return {};
  }
};

/**
 * Sauvegarder les stocks dans le localStorage
 */
const saveStocksToLocalStorage = (stocks: StockData): void => {
  try {
    localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(stocks));
  } catch (error) {
    console.error('Error saving stocks to localStorage:', error);
  }
};

/**
 * Récupérer le stock d'une taille depuis localStorage
 */
const getStockFromLocalStorage = (productId: number, colorId: number | string, sizeId: number | string): number => {
  const stocks = loadStocksFromLocalStorage();
  const colorKey = typeof colorId === 'string' ? colorId : colorId.toString();
  const sizeKey = typeof sizeId === 'string' ? sizeId : sizeId.toString();
  return stocks[productId]?.[colorKey]?.[sizeKey] ?? 0;
};

/**
 * Mettre à jour le stock dans localStorage
 */
const updateStockInLocalStorage = (
  productId: number,
  colorId: number,
  sizeId: number,
  stock: number
): void => {
  const stocks = loadStocksFromLocalStorage();

  if (!stocks[productId]) {
    stocks[productId] = {};
  }
  if (!stocks[productId][colorId]) {
    stocks[productId][colorId] = {};
  }

  stocks[productId][colorId][sizeId] = stock;
  saveStocksToLocalStorage(stocks);
};

/**
 * Récupérer tous les produits mockups depuis la base de données
 * avec les stocks depuis le backend API
 */
export const fetchProductsWithStock = async (): Promise<ProductStock[]> => {
  try {
    console.log('🔄 [StockService] Fetching products from database...');
    const response = await axios.get(`${API_BASE}/products`, {
      withCredentials: true
    });

    const products = response.data.data || response.data;

    console.log('🔍 [DEBUG] Backend response:', response.data);
    console.log('🔍 [DEBUG] Products count:', products.length);

    if (!Array.isArray(products)) {
      console.error('❌ [StockService] Response is not an array:', products);
      return [];
    }

    // Transformer les produits pour inclure les informations de stock depuis l'API
    const productsWithStock: ProductStock[] = products.map((product: any) => {
      console.log('🔍 [DEBUG] Product:', product.id, product.name);
      console.log('🔍 [DEBUG] Product.sizes:', product.sizes);

      const colorVariations = (product.colorVariations || []).map((color: any) => {
        // Selon render.md, le backend retourne color.stocks comme array d'objets
        // Format: [{ sizeName: "M", stock: 25 }, { sizeName: "L", stock: 30 }]
        const stocksArray = color.stocks || [];
        console.log('🔍 [DEBUG] Color', color.id, 'stocks array:', stocksArray);

        // Convertir l'array en objet pour faciliter l'accès
        const colorStocks: Record<string, number> = {};
        if (Array.isArray(stocksArray)) {
          stocksArray.forEach((s: any) => {
            colorStocks[s.sizeName] = s.stock;
          });
        }

        console.log('🔍 [DEBUG] Color', color.id, 'stocks object:', colorStocks);

        let sizes = [];

        // Priorité 1: Utiliser les sizes/variations du produit (venant de la catégorie)
        if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
          // Les vraies variations de la catégorie
          sizes = product.sizes.map((size: any) => {
            // Gérer le cas où size est un objet {id, sizeName} ou une string
            const sizeName = typeof size === 'string' ? size : (size.sizeName || size.name || String(size));

            return {
              id: `${color.id}-${sizeName}`,
              sizeName,
              stock: colorStocks[sizeName] || 0 // Récupérer le stock s'il existe
            };
          });
        }
        // Priorité 2: Si le backend retourne des stocks sans sizes dans le produit
        else if (Object.keys(colorStocks).length > 0) {
          sizes = Object.entries(colorStocks).map(([sizeName, stock]) => ({
            id: `${color.id}-${sizeName}`,
            sizeName,
            stock: stock as number
          }));
        }
        // Priorité 3: Tailles par défaut pour le visuel
        else {
          const defaultSizes = ['S', 'M', 'L', 'XL', 'XXL'];
          sizes = defaultSizes.map((sizeName, index) => ({
            id: `${color.id}-default-${index}`,
            sizeName,
            stock: 0
          }));
        }

        return {
          id: color.id,
          name: color.name,
          colorCode: color.colorCode,
          images: (color.images || []).map((img: any) => ({
            id: img.id,
            url: img.url,
            view: img.view
          })),
          sizes
        };
      });

      // Calculer le stock total depuis les données API
      const totalStock = colorVariations.reduce((total: number, color: ColorVariation) => {
        const colorTotal = color.sizes.reduce((sum, size) => sum + (size.stock || 0), 0);
        console.log('🔍 [DEBUG] Color', color.id, 'total:', colorTotal);
        return total + colorTotal;
      }, 0);

      console.log('🔍 [DEBUG] Product', product.id, 'totalStock:', totalStock);

      // Récupérer l'image principale
      const mainImage = colorVariations[0]?.images[0]?.url || undefined;

      // Récupérer la catégorie (format: "Parent > Child")
      let category: string | undefined;
      let subcategory: string | undefined;

      if (product.categories && Array.isArray(product.categories) && product.categories.length > 0) {
        const firstCategory = product.categories[0];

        // Si c'est une string (format "Parent > Child")
        if (typeof firstCategory === 'string' && firstCategory.includes(' > ')) {
          const parts = firstCategory.split(' > ');
          category = parts[0];
          subcategory = parts[1];
        }
        // Si c'est une string simple
        else if (typeof firstCategory === 'string') {
          category = firstCategory;
        }
        // Si c'est un objet avec une propriété name
        else if (typeof firstCategory === 'object' && firstCategory.name) {
          category = firstCategory.name;
        }
      }

      return {
        id: product.id,
        name: product.name,
        category,
        subcategory,
        mainImage,
        totalStock,
        colorVariations
      };
    });

    console.log('✅ [StockService] Products with stock loaded:', productsWithStock.length);
    return productsWithStock;
  } catch (error) {
    console.error('❌ [StockService] Error fetching products:', error);
    throw error;
  }
};

/**
 * Mettre à jour le stock d'une taille via API ou localStorage
 */
export const updateSizeStock = async (
  productId: number,
  colorId: number | string,
  sizeId: number | string,
  stock: number
): Promise<void> => {
  if (STOCK_MODE === 'localStorage' as any) {
    console.log('🔄 [StockService] Updating stock in localStorage:', {
      productId,
      colorId,
      sizeId,
      stock
    });

    // Convertir les IDs en string pour la clé localStorage
    const colorKey = typeof colorId === 'string' ? colorId : colorId.toString();
    const sizeKey = typeof sizeId === 'string' ? sizeId : sizeId.toString();

    const stocks = loadStocksFromLocalStorage();

    if (!stocks[productId]) {
      stocks[productId] = {};
    }
    if (!stocks[productId][colorKey]) {
      stocks[productId][colorKey] = {};
    }

    stocks[productId][colorKey][sizeKey] = stock;
    saveStocksToLocalStorage(stocks);

    console.log('✅ [StockService] Stock updated successfully in localStorage');
    return;
  }

  // Mode API: utiliser l'endpoint PATCH pour mettre à jour un stock spécifique
  try {
    console.log('📤 [StockService] Updating stock via API:', {
      productId,
      colorId,
      sizeId,
      stock
    });

    // Extraire le sizeName depuis le sizeId (format: "colorId-sizeName")
    const sizeIdStr = sizeId.toString();
    const sizeName = sizeIdStr.includes('-') ? sizeIdStr.split('-').slice(1).join('-') : sizeIdStr;

    // Utiliser l'endpoint de mise à jour bulk pour simplicité
    await updateProductStocks(productId, [{
      colorId: typeof colorId === 'number' ? colorId : parseInt(colorId as string),
      sizeName,
      stock
    }]);

    console.log('✅ [StockService] Stock updated successfully via API');
  } catch (error) {
    console.error('❌ [StockService] Error updating stock via API:', error);
    throw error;
  }
};

/**
 * Recharger le stock (ajouter au stock existant) via API ou localStorage
 * @param sizeId - Peut être soit un ID de ProductStock, soit un sizeName (string)
 */
export const rechargeStock = async (
  productId: number,
  colorId: number | string,
  sizeId: number | string,
  amount: number
): Promise<void> => {
  if (STOCK_MODE === 'localStorage' as any) {
    console.log('🔄 [StockService] Recharging stock in localStorage:', {
      productId,
      colorId,
      sizeId,
      amount
    });

    // Convertir les IDs en string pour la clé localStorage
    const colorKey = typeof colorId === 'string' ? colorId : colorId.toString();
    const sizeKey = typeof sizeId === 'string' ? sizeId : sizeId.toString();

    const stocks = loadStocksFromLocalStorage();
    const currentStock = stocks[productId]?.[colorKey]?.[sizeKey] ?? 0;
    const newStock = currentStock + amount;

    if (!stocks[productId]) {
      stocks[productId] = {};
    }
    if (!stocks[productId][colorKey]) {
      stocks[productId][colorKey] = {};
    }

    stocks[productId][colorKey][sizeKey] = newStock;
    saveStocksToLocalStorage(stocks);

    console.log('✅ [StockService] Stock recharged successfully in localStorage');
    return;
  }

  // Mode API: récupérer le stock actuel, puis mettre à jour
  try {
    console.log('📤 [StockService] Recharging stock via API:', {
      productId,
      colorId,
      sizeId,
      amount
    });

    // Extraire le sizeName depuis le sizeId (format: "colorId-sizeName")
    const sizeIdStr = sizeId.toString();
    const sizeName = sizeIdStr.includes('-') ? sizeIdStr.split('-').slice(1).join('-') : sizeIdStr;

    // Récupérer tous les produits pour trouver le stock actuel
    const productsResponse = await axios.get(`${API_BASE}/products`, {
      withCredentials: true
    });

    const products = productsResponse.data.data || productsResponse.data;
    const product = products.find((p: any) => p.id === productId);

    if (!product) {
      throw new Error('Produit introuvable');
    }

    // Trouver la couleur et le stock actuel
    const color = product.colorVariations?.find((c: any) => c.id === Number(colorId));
    const currentStock = color?.stocks?.[sizeName] || 0;

    // Calculer le nouveau stock
    const newStock = currentStock + amount;

    // Mettre à jour via l'endpoint bulk (fait un upsert)
    await updateProductStocks(productId, [{
      colorId: Number(colorId),
      sizeName,
      stock: newStock
    }]);

    console.log('✅ [StockService] Stock recharged successfully via API');
  } catch (error) {
    console.error('❌ [StockService] Error recharging stock via API:', error);
    throw error;
  }
};

/**
 * 🔄 API: Sauvegarder les stocks d'un produit complet via API
 * Utilisé lors de la création/édition de produit
 */
export const updateProductStocks = async (
  productId: number,
  stocks: { colorId: number; sizeName: string; stock: number }[]
): Promise<void> => {
  if (STOCK_MODE === 'localStorage' as any) {
    console.log('⚠️ [StockService] Mode localStorage - API non appelée');
    // Sauvegarder dans localStorage pour compatibilité
    stocks.forEach(item => {
      updateSizeStock(productId, item.colorId, item.sizeName, item.stock);
    });
    return;
  }

  try {
    console.log('📤 [StockService] Updating stocks via API:', { productId, count: stocks.length });

    await axios.post(
      `${API_BASE}/products/${productId}/stocks`,
      { stocks },
      { withCredentials: true }
    );

    console.log('✅ [StockService] Stocks updated successfully via API');

    // Si mode hybrid, aussi sauvegarder en localStorage
    if (STOCK_MODE === 'hybrid' as any) {
      stocks.forEach(item => {
        updateSizeStock(productId, item.colorId, item.sizeName, item.stock);
      });
    }
  } catch (error) {
    console.error('❌ [StockService] Error updating stocks via API:', error);
    throw error;
  }
};

/**
 * 🔄 API: Récupérer les stocks d'un produit spécifique
 */
export const getProductStocks = async (productId: number): Promise<any> => {
  if (STOCK_MODE === 'localStorage' as any) {
    console.log('⚠️ [StockService] Mode localStorage - API non appelée');
    return null;
  }

  try {
    console.log('📥 [StockService] Fetching stocks via API:', productId);

    const response = await axios.get(
      `${API_BASE}/products/${productId}/stocks`,
      { withCredentials: true }
    );

    console.log('✅ [StockService] Stocks fetched successfully via API');
    return response.data.data;
  } catch (error) {
    console.error('❌ [StockService] Error fetching stocks via API:', error);
    throw error;
  }
};

/**
 * 🔄 API: Recharger un stock spécifique (ajouter au stock existant)
 */
export const rechargeStockAPI = async (
  productId: number,
  stockId: number,
  amount: number
): Promise<void> => {
  if (STOCK_MODE === 'localStorage' as any) {
    console.log('⚠️ [StockService] Mode localStorage - API non appelée');
    return;
  }

  try {
    console.log('📤 [StockService] Recharging stock via API:', { productId, stockId, amount });

    await axios.post(
      `${API_BASE}/products/${productId}/stocks/${stockId}/recharge`,
      { amount },
      { withCredentials: true }
    );

    console.log('✅ [StockService] Stock recharged successfully via API');
  } catch (error) {
    console.error('❌ [StockService] Error recharging stock via API:', error);
    throw error;
  }
};

/**
 * 📥 Entrée de stock (réception)
 */
export const stockIn = async (
  productId: number,
  colorId: number,
  sizeName: string,
  quantity: number,
  reason?: string
): Promise<void> => {
  try {
    console.log('📤 [StockService] Stock IN via API:', { productId, colorId, sizeName, quantity, reason });

    await axios.post(
      `${API_BASE}/products/${productId}/stocks/movement`,
      {
        colorId,
        sizeName,
        type: 'IN',
        quantity,
        reason
      },
      { withCredentials: true }
    );

    console.log('✅ [StockService] Stock IN successful');
  } catch (error) {
    console.error('❌ [StockService] Error stock IN:', error);
    throw error;
  }
};

/**
 * 📤 Sortie de stock
 */
export const stockOut = async (
  productId: number,
  colorId: number,
  sizeName: string,
  quantity: number,
  reason?: string
): Promise<void> => {
  try {
    console.log('📤 [StockService] Stock OUT via API:', { productId, colorId, sizeName, quantity, reason });

    await axios.post(
      `${API_BASE}/products/${productId}/stocks/movement`,
      {
        colorId,
        sizeName,
        type: 'OUT',
        quantity,
        reason
      },
      { withCredentials: true }
    );

    console.log('✅ [StockService] Stock OUT successful');
  } catch (error) {
    console.error('❌ [StockService] Error stock OUT:', error);
    throw error;
  }
};

/**
 * 📜 Récupérer l'historique des mouvements de stock
 */
export const getStockHistory = async (
  productId: number,
  options?: {
    colorId?: number;
    sizeName?: string;
    type?: StockMovementType;
    limit?: number;
    offset?: number;
  }
): Promise<{ movements: StockMovement[]; total: number }> => {
  try {
    console.log('📥 [StockService] Fetching stock history:', { productId, options });

    const params = new URLSearchParams();
    if (options?.colorId) params.append('colorId', options.colorId.toString());
    if (options?.sizeName) params.append('sizeName', options.sizeName);
    if (options?.type) params.append('type', options.type);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const response = await axios.get(
      `${API_BASE}/products/${productId}/stocks/history?${params.toString()}`,
      { withCredentials: true }
    );

    console.log('✅ [StockService] Stock history fetched');
    return response.data.data;
  } catch (error) {
    console.error('❌ [StockService] Error fetching stock history:', error);
    throw error;
  }
};
