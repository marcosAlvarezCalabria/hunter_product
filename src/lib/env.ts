import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().default('file:./dev.db'),
  SCRAPER_BASE_URL: z.string().url().default('https://www.elcorteingles.es'),
  SCRAPER_CATEGORY_PATH: z.string().default('/juguetes/ofertas'),
  SCRAPER_USER_AGENT: z.string().min(20),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL ?? 'file:./dev.db',
  SCRAPER_BASE_URL: process.env.SCRAPER_BASE_URL ?? 'https://www.elcorteingles.es',
  SCRAPER_CATEGORY_PATH: process.env.SCRAPER_CATEGORY_PATH ?? '/juguetes/ofertas',
  SCRAPER_USER_AGENT:
    process.env.SCRAPER_USER_AGENT ??
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
});
