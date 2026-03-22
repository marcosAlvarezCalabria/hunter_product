import { ScrapedProduct } from '@prisma/client';
import { ReportGenerator } from '@/modules/reports/report-generator';

const escapeCsv = (value: string | number | null): string => {
  if (value === null) {
    return '';
  }

  const stringValue = String(value);
  return /[",\n]/.test(stringValue) ? `"${stringValue.replaceAll('"', '""')}"` : stringValue;
};

export class CsvReportGenerator implements ReportGenerator<string> {
  generate(products: ScrapedProduct[]): string {
    const headers = [
      'title',
      'brand',
      'currentPrice',
      'originalPrice',
      'discountPercent',
      'availability',
      'productUrl',
      'scrapedAt',
    ];

    const rows = products.map((product) =>
      [
        product.title,
        product.brand,
        product.currentPrice,
        product.originalPrice,
        product.discountPercent,
        product.availability,
        product.productUrl,
        product.scrapedAt.toISOString(),
      ]
        .map(escapeCsv)
        .join(','),
    );

    return [headers.join(','), ...rows].join('\n');
  }
}
