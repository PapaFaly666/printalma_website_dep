export type AnyProduct = Record<string, any>;

export function toNumberOrUndefined(value: any): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

export function normalizeProductFromApi(apiProduct: AnyProduct) {
  const suggestedRaw = apiProduct?.suggestedPrice ?? apiProduct?.suggested_price ?? null;
  return {
    ...apiProduct,
    suggestedPrice: toNumberOrUndefined(suggestedRaw),
  };
}

export function normalizeSizes(sizes: any[]): string[] {
  if (!Array.isArray(sizes)) {
    return [];
  }
  
  return sizes.map(size => {
    if (typeof size === 'string') return size;
    if (typeof size === 'number') return String(size);
    return String(size);
  });
}

export function validateSizes(sizes: any[]): boolean {
  if (!Array.isArray(sizes)) {
    throw new Error('Sizes doit être un tableau');
  }
  
  if (sizes.length === 0) {
    return true; // Empty array is valid
  }
  
  // Check for mixed types
  const types = [...new Set(sizes.map(size => typeof size))];
  if (types.length > 1) {
    console.warn('Types mixtes détectés dans sizes, normalisation vers strings');
    return false;
  }
  
  return true;
}

export function cleanProductPayload(payload: AnyProduct): AnyProduct {
  const cleaned = { ...payload };
  
  // Nettoyer sizes - convertir tout en strings pour éviter les types mixtes
  if (cleaned.sizes && Array.isArray(cleaned.sizes)) {
    cleaned.sizes = cleaned.sizes.map(size => {
      // Si c'est déjà une string, la garder
      if (typeof size === 'string') return size;
      // Si c'est un nombre, le convertir en string
      if (typeof size === 'number') return String(size);
      // Cas de sécurité
      return String(size);
    });
  }
  
  // S'assurer que les champs numériques sont bien des nombres
  if (cleaned.price) cleaned.price = Number(cleaned.price);
  if (cleaned.suggestedPrice !== null && cleaned.suggestedPrice !== undefined) {
    cleaned.suggestedPrice = Number(cleaned.suggestedPrice);
  }
  if (cleaned.stock !== null && cleaned.stock !== undefined) {
    cleaned.stock = Number(cleaned.stock);
  }
  
  console.log('🧹 Payload nettoyé:', cleaned);
  return cleaned;
}

export function prepareProductPayload(formValues: AnyProduct) {
  const payload: AnyProduct = { ...formValues };

  if ('suggestedPrice' in payload) {
    const num = toNumberOrUndefined(payload.suggestedPrice);
    if (num === undefined) delete payload.suggestedPrice; else payload.suggestedPrice = num;
  }

  if ('price' in payload) {
    const num = toNumberOrUndefined(payload.price);
    if (num === undefined) delete payload.price; else payload.price = num;
  }

  // Normalize sizes to ensure consistent string types
  if ('sizes' in payload && payload.sizes) {
    payload.sizes = normalizeSizes(payload.sizes);
  }

  Object.keys(payload).forEach((k) => {
    const v = payload[k];
    if (v === null || v === undefined || v === '') delete payload[k];
  });

  // Appliquer le nettoyage final
  return cleanProductPayload(payload);
}





