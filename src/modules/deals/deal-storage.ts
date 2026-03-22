import { ScrapedProduct, ScrapeRun } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { buildProductKey } from '@/modules/scraping/elcorteingles-parser';
import { NormalizedDeal } from '@/modules/deals/deal-scorer';
import { ScrapeConfig } from '@/modules/scraping/contracts';

export interface PersistedRun {
  scrapeRun: ScrapeRun;
  products: ScrapedProduct[];
}

export class DealStorage {
  async persistScrapeRun(config: ScrapeConfig, deals: NormalizedDeal[], scanned: number, logs: string[]): Promise<PersistedRun> {
    return prisma.$transaction(async (tx) => {
      const scrapeRun = await tx.scrapeRun.create({
        data: {
          status: 'completed',
          totalScanned: scanned,
          totalValid: deals.length,
          minDiscount: config.minDiscountPercent,
          category: config.category,
          maxPagesToScan: config.maxPagesToScan,
          onlyInStock: config.onlyInStock,
          finishedAt: new Date(),
          snapshotJson: JSON.stringify({ scanned, valid: deals.length, logs }),
          reportStatus: 'ready',
        },
      });

      const products: ScrapedProduct[] = [];
      for (const deal of deals) {
        const productKey = buildProductKey(deal.productUrl, deal.sku);
        const stored = await tx.scrapedProduct.upsert({
          where: { productUrl: deal.productUrl },
          create: {
            productKey,
            source: deal.source,
            title: deal.title,
            brand: deal.brand,
            currentPrice: deal.currentPrice,
            originalPrice: deal.originalPrice,
            discountPercent: deal.discountPercent,
            confidence: deal.confidence,
            productUrl: deal.productUrl,
            imageUrl: deal.imageUrl,
            availability: deal.availability,
            sku: deal.sku,
            ean: deal.ean,
            categoryPath: deal.categoryPath,
            isMarketplace: deal.isMarketplace,
            scrapedAt: deal.scrapedAt,
            lastSeenAt: new Date(),
            rawPayload: deal.rawPayload,
            scrapeRunId: scrapeRun.id,
          },
          update: {
            title: deal.title,
            brand: deal.brand,
            currentPrice: deal.currentPrice,
            originalPrice: deal.originalPrice,
            discountPercent: deal.discountPercent,
            confidence: deal.confidence,
            imageUrl: deal.imageUrl,
            availability: deal.availability,
            sku: deal.sku,
            ean: deal.ean,
            categoryPath: deal.categoryPath,
            isMarketplace: deal.isMarketplace,
            scrapedAt: deal.scrapedAt,
            lastSeenAt: new Date(),
            rawPayload: deal.rawPayload,
            scrapeRunId: scrapeRun.id,
          },
        });
        products.push(stored);
      }

      return { scrapeRun, products };
    });
  }

  async listDeals(filters: { minDiscount?: number; brand?: string; availability?: string }) {
    return prisma.scrapedProduct.findMany({
      where: {
        discountPercent: typeof filters.minDiscount === 'number' ? { gte: filters.minDiscount } : undefined,
        brand: filters.brand ? { equals: filters.brand, mode: 'insensitive' } : undefined,
        availability: filters.availability ? { contains: filters.availability, mode: 'insensitive' } : undefined,
      },
      orderBy: [{ discountPercent: 'desc' }, { currentPrice: 'asc' }],
    });
  }

  async getLatestRun() {
    return prisma.scrapeRun.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { products: { orderBy: [{ discountPercent: 'desc' }, { currentPrice: 'asc' }] } },
    });
  }
}
