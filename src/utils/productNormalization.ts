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

  Object.keys(payload).forEach((k) => {
    const v = payload[k];
    if (v === null || v === undefined || v === '') delete payload[k];
  });

  return payload;
}




