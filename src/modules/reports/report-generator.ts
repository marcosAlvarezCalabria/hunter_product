import { ScrapedProduct } from '@prisma/client';

export interface ReportGenerator<TOutput> {
  generate(products: ScrapedProduct[]): TOutput;
}
