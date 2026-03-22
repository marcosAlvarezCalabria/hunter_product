import { NextResponse } from 'next/server';
import { DealStorage } from '@/modules/deals/deal-storage';
import { CsvReportGenerator } from '@/modules/reports/csv-report-generator';

export async function GET() {
  const storage = new DealStorage();
  const deals = await storage.listDeals({});
  const report = new CsvReportGenerator().generate(deals);

  return new NextResponse(report, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="eci-toys-deals.csv"',
    },
  });
}
