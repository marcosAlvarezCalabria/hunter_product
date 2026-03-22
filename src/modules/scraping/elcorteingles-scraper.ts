import { chromium, Page } from 'playwright';
import { env } from '@/lib/env';
import { DealScorer } from '@/modules/deals/deal-scorer';
import { parseElCorteInglesProduct } from '@/modules/scraping/elcorteingles-parser';
import { ScrapeConfig, ScrapeResult, Scraper } from '@/modules/scraping/contracts';

const scorer = new DealScorer();
const RETRIES = 2;
const TIMEOUT_MS = 30_000;

const selectors = {
  productCards: '[data-test="product-card"], article[data-product-id], .product-preview, li[data-product-id]',
};

const waitForCatalog = async (page: Page): Promise<void> => {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1_000);
};

const detectBlocking = async (page: Page): Promise<boolean> => {
  const content = (await page.content()).toLowerCase();
  return /captcha|access denied|blocked|forbidden/.test(content);
};

const extractStructuredProducts = async (page: Page): Promise<Record<string, unknown>[]> => {
  return page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'));
    const records: Record<string, unknown>[] = [];

    for (const script of scripts) {
      try {
        const parsed = JSON.parse(script.textContent ?? 'null');
        const items = Array.isArray(parsed) ? parsed : [parsed];

        for (const item of items) {
          if (!item || typeof item !== 'object') {
            continue;
          }

          const candidate = item as Record<string, unknown>;
          if (candidate['@type'] === 'Product' || candidate.name || candidate.offers) {
            const offers = typeof candidate.offers === 'object' && candidate.offers !== null ? (candidate.offers as Record<string, unknown>) : {};
            records.push({
              title: candidate.name,
              brand: typeof candidate.brand === 'object' && candidate.brand !== null ? (candidate.brand as Record<string, unknown>).name : candidate.brand,
              currentPrice: offers.price,
              originalPrice: offers.highPrice ?? offers.priceSpecification?.price,
              availability: offers.availability,
              productUrl: candidate.url,
              imageUrl: Array.isArray(candidate.image) ? candidate.image[0] : candidate.image,
              sku: candidate.sku,
              ean: candidate.gtin13 ?? candidate.gtin,
              categoryPath: candidate.category,
            });
          }
        }
      } catch {
        // ignore invalid structured data
      }
    }

    const fallbackCards = Array.from(document.querySelectorAll('[data-test="product-card"], article[data-product-id], .product-preview, li[data-product-id]'));

    for (const card of fallbackCards) {
      const title = card.querySelector('a[title], h3, h2')?.textContent?.trim();
      const productUrl = card.querySelector('a[href]')?.getAttribute('href');
      const imageUrl = card.querySelector('img')?.getAttribute('src');
      const currentPrice = card.querySelector('[data-test="current-price"], .price-current, .price')?.textContent?.trim();
      const originalPrice = card.querySelector('[data-test="original-price"], .price-previous, .price-old')?.textContent?.trim();
      const discountPercent = card.querySelector('[data-test="discount"], .discount')?.textContent?.trim();
      const availability = card.textContent?.includes('Agotado') ? 'agotado' : 'disponible';
      const brand = card.querySelector('[data-test="brand"], .brand')?.textContent?.trim();
      const sku = card.getAttribute('data-product-id');

      records.push({
        title,
        productUrl,
        imageUrl,
        currentPrice,
        originalPrice,
        discountPercent,
        availability,
        brand,
        sku,
      });
    }

    return records;
  });
};

export class ElCorteInglesDealsScraper implements Scraper {
  async run(config: ScrapeConfig): Promise<ScrapeResult> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ userAgent: env.SCRAPER_USER_AGENT, locale: 'es-ES' });
    const page = await context.newPage();
    const logs: string[] = [];
    const dealsMap = new Map<string, ReturnType<typeof parseElCorteInglesProduct>>();
    let scanned = 0;

    try {
      for (let pageIndex = 1; pageIndex <= config.maxPagesToScan; pageIndex += 1) {
        const targetUrl = new URL(env.SCRAPER_CATEGORY_PATH, env.SCRAPER_BASE_URL);
        targetUrl.searchParams.set('page', String(pageIndex));
        logs.push(`Scanning ${targetUrl.toString()}`);

        let success = false;
        for (let attempt = 1; attempt <= RETRIES + 1; attempt += 1) {
          try {
            await page.goto(targetUrl.toString(), { waitUntil: 'domcontentloaded', timeout: TIMEOUT_MS });
            await waitForCatalog(page);

            if (await detectBlocking(page)) {
              throw new Error('Potential blocking detected');
            }

            success = true;
            break;
          } catch (error) {
            logs.push(`Attempt ${attempt} failed for page ${pageIndex}: ${error instanceof Error ? error.message : 'unknown error'}`);
            if (attempt > RETRIES) {
              throw error;
            }
          }
        }

        if (!success) {
          break;
        }

        const hasProducts = (await page.locator(selectors.productCards).count()) > 0;
        const extracted = await extractStructuredProducts(page);

        if (!hasProducts && extracted.length === 0) {
          logs.push(`No products found on page ${pageIndex}, stopping pagination.`);
          break;
        }

        for (const rawProduct of extracted) {
          scanned += 1;
          const parsed = parseElCorteInglesProduct(rawProduct, new Date(), env.SCRAPER_BASE_URL);
          if (!parsed) {
            continue;
          }

          if (!scorer.shouldKeep(parsed, config.minDiscountPercent, config.onlyInStock)) {
            continue;
          }

          dealsMap.set(parsed.productUrl, parsed);
        }
      }

      return {
        scanned,
        kept: dealsMap.size,
        deals: Array.from(dealsMap.values()).filter((value): value is NonNullable<typeof value> => Boolean(value)),
        logs,
      };
    } finally {
      await page.close();
      await context.close();
      await browser.close();
    }
  }
}
