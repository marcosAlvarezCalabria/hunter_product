import { ScrapedProduct } from '@prisma/client';
import { ReportGenerator } from '@/modules/reports/report-generator';

export class JsonReportGenerator implements ReportGenerator<string> {
  generate(products: ScrapedProduct[]): string {
    return JSON.stringify(
      products.map((product) => ({
        ...product,
        scrapedAt: product.scrapedAt.toISOString(),
        lastSeenAt: product.lastSeenAt.toISOString(),
      })),
      null,
      2,
    );
  }
}
