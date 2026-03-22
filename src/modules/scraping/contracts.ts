import { NormalizedDeal } from '@/modules/deals/deal-scorer';

export interface ScrapeConfig {
  minDiscountPercent: number;
  category: string;
  maxPagesToScan: number;
  onlyInStock: boolean;
}

export interface ScrapeResult {
  scanned: number;
  kept: number;
  deals: NormalizedDeal[];
  logs: string[];
}

export interface Scraper {
  run(config: ScrapeConfig): Promise<ScrapeResult>;
}
