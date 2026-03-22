import { z } from 'zod';

export const normalizedDealSchema = z.object({
  source: z.literal('elcorteingles'),
  title: z.string().min(1),
  brand: z.string().trim().nullable(),
  currentPrice: z.number().positive(),
  originalPrice: z.number().positive().nullable(),
  discountPercent: z.number().min(0).max(100).nullable(),
  confidence: z.enum(['high', 'low']),
  productUrl: z.string().url(),
  imageUrl: z.string().url().nullable(),
  availability: z.string().trim().nullable(),
  sku: z.string().trim().nullable(),
  ean: z.string().trim().nullable(),
  scrapedAt: z.date(),
  categoryPath: z.string().trim().nullable(),
  isMarketplace: z.boolean(),
  rawPayload: z.string(),
});

export type NormalizedDeal = z.infer<typeof normalizedDealSchema>;

export interface IDealScorer {
  shouldKeep(input: NormalizedDeal, minDiscountPercent: number, onlyInStock: boolean): boolean;
}

export class DealScorer implements IDealScorer {
  shouldKeep(input: NormalizedDeal, minDiscountPercent: number, onlyInStock: boolean): boolean {
    if (!input.productUrl || !input.currentPrice) {
      return false;
    }

    if (input.isMarketplace) {
      return false;
    }

    if (onlyInStock && input.availability && !/stock|disponible|entrega|recogida/i.test(input.availability)) {
      return false;
    }

    if (typeof input.discountPercent !== 'number') {
      return false;
    }

    return input.discountPercent >= minDiscountPercent;
  }
}
