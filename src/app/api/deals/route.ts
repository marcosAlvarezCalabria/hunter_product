import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DealStorage } from '@/modules/deals/deal-storage';

const querySchema = z.object({
  minDiscount: z.coerce.number().optional(),
  brand: z.string().optional(),
  availability: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.parse({
    minDiscount: request.nextUrl.searchParams.get('minDiscount') ?? undefined,
    brand: request.nextUrl.searchParams.get('brand') ?? undefined,
    availability: request.nextUrl.searchParams.get('availability') ?? undefined,
  });

  const storage = new DealStorage();
  const deals = await storage.listDeals(parsed);
  return NextResponse.json({ data: deals });
}
