import { DealStorage } from '@/modules/deals/deal-storage';
import { defaultScrapeConfig } from '@/db/default-config';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { createHtmlReport } from '@/modules/reports/html-report';
import { runScrapeAction } from '@/app/dashboard/actions';

interface DashboardPageProps {
  searchParams: Promise<{
    minDiscount?: string;
    brand?: string;
    availability?: string;
  }>;
}

const StatusBadge = ({ value }: { value: string | null }) => (
  <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-200">{value ?? 'n/d'}</span>
);

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const storage = new DealStorage();
  const minDiscount = params.minDiscount ? Number(params.minDiscount) : undefined;
  const deals = await storage.listDeals({
    minDiscount,
    brand: params.brand,
    availability: params.availability,
  });
  const latestRun = await storage.getLatestRun();
  const htmlReport = latestRun ? createHtmlReport(latestRun) : null;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/50 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-400">eci-toys-deal-hunter</p>
          <h1 className="text-3xl font-semibold">Dashboard de oportunidades en El Corte Inglés</h1>
          <p className="max-w-3xl text-sm text-slate-300">
            MVP centrado en juguetes rebajados con scraping en Node runtime, persistencia local SQLite y exportes accionables.
          </p>
        </div>
        <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-slate-500">Descuento mínimo</p>
            <p className="text-2xl font-semibold">{defaultScrapeConfig.minDiscountPercent}%</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-slate-500">Páginas máximas</p>
            <p className="text-2xl font-semibold">{defaultScrapeConfig.maxPagesToScan}</p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <form className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 md:grid-cols-4">
          <input
            name="minDiscount"
            type="number"
            placeholder="Descuento mínimo"
            defaultValue={params.minDiscount ?? defaultScrapeConfig.minDiscountPercent}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none ring-0"
          />
          <input
            name="brand"
            placeholder="Marca"
            defaultValue={params.brand}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none ring-0"
          />
          <select
            name="availability"
            defaultValue={params.availability ?? ''}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none ring-0"
          >
            <option value="">Disponibilidad</option>
            <option value="disponible">Disponible</option>
            <option value="agotado">Agotado</option>
          </select>
          <button type="submit" className="rounded-xl bg-sky-500 px-4 py-2 font-medium text-slate-950 hover:bg-sky-400">
            Filtrar
          </button>
        </form>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex flex-wrap gap-3">
            <form action={runScrapeAction}>
              <button type="submit" className="rounded-xl bg-emerald-400 px-4 py-2 font-medium text-slate-950 hover:bg-emerald-300">
                Run Scrape
              </button>
            </form>
            <a href="/api/reports/csv" className="rounded-xl border border-slate-700 px-4 py-2 text-slate-100">
              Export CSV
            </a>
            <a href="/api/reports/json" className="rounded-xl border border-slate-700 px-4 py-2 text-slate-100">
              Export JSON
            </a>
            {htmlReport ? (
              <a
                href={`data:text/html;charset=utf-8,${encodeURIComponent(htmlReport)}`}
                download="eci-toys-report.html"
                className="rounded-xl border border-slate-700 px-4 py-2 text-slate-100"
              >
                Export HTML
              </a>
            ) : null}
          </div>
          <div className="mt-4 text-sm text-slate-400">
            Último scrape: {latestRun ? formatDateTime(latestRun.createdAt) : 'sin ejecuciones'}.
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-slate-950/70 text-left text-slate-400">
              <tr>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Marca</th>
                <th className="px-4 py-3">Precio actual</th>
                <th className="px-4 py-3">Precio anterior</th>
                <th className="px-4 py-3">Descuento %</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Enlace</th>
                <th className="px-4 py-3">Fecha scrapeo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {deals.map((deal) => (
                <tr key={deal.id} className="hover:bg-slate-950/40">
                  <td className="px-4 py-3 font-medium text-slate-100">{deal.title}</td>
                  <td className="px-4 py-3 text-slate-300">{deal.brand ?? '-'}</td>
                  <td className="px-4 py-3 text-slate-300">{formatCurrency(deal.currentPrice)}</td>
                  <td className="px-4 py-3 text-slate-300">{formatCurrency(deal.originalPrice)}</td>
                  <td className="px-4 py-3 text-emerald-300">{deal.discountPercent?.toFixed(2) ?? '-'}%</td>
                  <td className="px-4 py-3 text-slate-300"><StatusBadge value={deal.availability} /></td>
                  <td className="px-4 py-3"><a href={deal.productUrl} target="_blank" rel="noreferrer">Abrir</a></td>
                  <td className="px-4 py-3 text-slate-300">{formatDateTime(deal.scrapedAt)}</td>
                </tr>
              ))}
              {deals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    No hay deals persistidos todavía. Ejecuta un scrape manual para poblar la base de datos.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
