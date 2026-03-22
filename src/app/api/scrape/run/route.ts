import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ScrapeOrchestrator } from '@/modules/scheduler/scrape-orchestrator';

const bodySchema = z.object({
  minDiscountPercent: z.number().int().min(0).max(100).optional(),
  category: z.string().optional(),
  maxPagesToScan: z.number().int().min(1).max(100).optional(),
  onlyInStock: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const payload = bodySchema.parse(await request.json().catch(() => ({})));
    const orchestrator = new ScrapeOrchestrator();
    const response = await orchestrator.run(payload);

    return NextResponse.json({
      runId: response.persisted.scrapeRun.id,
      scanned: response.result.scanned,
      kept: response.result.kept,
      logs: response.result.logs,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 },
    );
  }
}
