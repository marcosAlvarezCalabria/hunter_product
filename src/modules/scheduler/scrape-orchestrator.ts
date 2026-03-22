import { defaultScrapeConfig } from '@/db/default-config';
import { DealStorage } from '@/modules/deals/deal-storage';
import { ElCorteInglesDealsScraper } from '@/modules/scraping/elcorteingles-scraper';
import { ScrapeConfig } from '@/modules/scraping/contracts';

export class ScrapeOrchestrator {
  constructor(
    private readonly scraper = new ElCorteInglesDealsScraper(),
    private readonly storage = new DealStorage(),
  ) {}

  async run(overrides?: Partial<ScrapeConfig>) {
    const config: ScrapeConfig = {
      ...defaultScrapeConfig,
      ...overrides,
    };

    const result = await this.scraper.run(config);
    const persisted = await this.storage.persistScrapeRun(config, result.deals, result.scanned, result.logs);

    return {
      config,
      result,
      persisted,
    };
  }
}
