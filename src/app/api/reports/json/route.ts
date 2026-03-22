import { NextResponse } from 'next/server';
import { DealStorage } from '@/modules/deals/deal-storage';
import { JsonReportGenerator } from '@/modules/reports/json-report-generator';

export async function GET() {
  const storage = new DealStorage();
  const deals = await storage.listDeals({});
  const report = new JsonReportGenerator().generate(deals);

  return new NextResponse(report, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="eci-toys-deals.json"',
    },
  });
}
