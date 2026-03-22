'use server';

import { revalidatePath } from 'next/cache';
import { ScrapeOrchestrator } from '@/modules/scheduler/scrape-orchestrator';

export const runScrapeAction = async () => {
  const orchestrator = new ScrapeOrchestrator();
  await orchestrator.run();
  revalidatePath('/dashboard');
};
