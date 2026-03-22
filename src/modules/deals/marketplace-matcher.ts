export interface MarketplaceMatcher {
  isMarketplace(payload: Record<string, unknown>): boolean;
}

export class ElCorteInglesMarketplaceMatcher implements MarketplaceMatcher {
  isMarketplace(payload: Record<string, unknown>): boolean {
    const candidates = [
      payload.seller,
      payload.soldBy,
      payload.fulfillment,
      payload.marketplace,
      payload.vendor,
    ]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase());

    return candidates.some((value) => value.includes('marketplace') || value.includes('vendido por terceros'));
  }
}
