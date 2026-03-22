import crypto from 'node:crypto';
import { NormalizedDeal, normalizedDealSchema } from '@/modules/deals/deal-scorer';
import { ElCorteInglesMarketplaceMatcher } from '@/modules/deals/marketplace-matcher';

interface RawProductPayload {
  title?: string;
  name?: string;
  brand?: string;
  currentPrice?: number | string;
  salePrice?: number | string;
  originalPrice?: number | string;
  listPrice?: number | string;
  discountPercent?: number | string;
  productUrl?: string;
  url?: string;
  imageUrl?: string;
  image?: string;
  availability?: string;
  sku?: string;
  ean?: string;
  categoryPath?: string;
  seller?: string;
  soldBy?: string;
  marketplace?: boolean | string;
  [key: string]: unknown;
}

const marketplaceMatcher = new ElCorteInglesMarketplaceMatcher();

const toNullableString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.replace(/[^\d,.-]/g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const computeDiscount = (currentPrice: number | null, originalPrice: number | null): number | null => {
  if (!currentPrice || !originalPrice || originalPrice <= currentPrice) {
    return null;
  }

  return Number((((originalPrice - currentPrice) / originalPrice) * 100).toFixed(2));
};

export const buildProductKey = (productUrl: string, sku: string | null): string => {
  const base = sku ? `${sku}:${productUrl}` : productUrl;
  return crypto.createHash('sha256').update(base).digest('hex');
};

export const parseElCorteInglesProduct = (
  rawPayload: RawProductPayload,
  scrapedAt: Date,
  baseUrl: string,
): NormalizedDeal | null => {
  const title = toNullableString(rawPayload.title ?? rawPayload.name);
  const currentPrice = toNumber(rawPayload.currentPrice ?? rawPayload.salePrice);
  const originalPrice = toNumber(rawPayload.originalPrice ?? rawPayload.listPrice);
  const explicitDiscount = toNumber(rawPayload.discountPercent);
  const discountPercent = explicitDiscount ?? computeDiscount(currentPrice, originalPrice);
  const confidence = explicitDiscount || (currentPrice && originalPrice) ? 'high' : 'low';
  const rawUrl = toNullableString(rawPayload.productUrl ?? rawPayload.url);

  if (!title || !currentPrice || !rawUrl) {
    return null;
  }

  const productUrl = new URL(rawUrl, baseUrl).toString();
  const imageUrl = toNullableString(rawPayload.imageUrl ?? rawPayload.image);

  const normalized = normalizedDealSchema.safeParse({
    source: 'elcorteingles',
    title,
    brand: toNullableString(rawPayload.brand),
    currentPrice,
    originalPrice,
    discountPercent,
    confidence,
    productUrl,
    imageUrl: imageUrl ? new URL(imageUrl, baseUrl).toString() : null,
    availability: toNullableString(rawPayload.availability),
    sku: toNullableString(rawPayload.sku),
    ean: toNullableString(rawPayload.ean),
    scrapedAt,
    categoryPath: toNullableString(rawPayload.categoryPath),
    isMarketplace: marketplaceMatcher.isMarketplace(rawPayload),
    rawPayload: JSON.stringify(rawPayload),
  });

  return normalized.success ? normalized.data : null;
};
