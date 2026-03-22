export type Confidence = 'high' | 'low';

export interface DealRecord {
  id: string;
  source: 'elcorteingles';
  title: string;
  brand: string | null;
  currentPrice: number;
  originalPrice: number | null;
  discountPercent: number | null;
  confidence: Confidence;
  productUrl: string;
  imageUrl: string | null;
  availability: string | null;
  sku: string | null;
  ean: string | null;
  categoryPath: string | null;
  isMarketplace: boolean;
  scrapedAt: string;
  lastSeenAt: string;
}

export interface DashboardFilters {
  minDiscount?: number;
  brand?: string;
  availability?: string;
}
