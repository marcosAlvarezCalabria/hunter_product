import { ScrapedProduct, ScrapeRun } from '@prisma/client';

export const createHtmlReport = (run: ScrapeRun & { products: ScrapedProduct[] }): string => {
  const rows = run.products
    .slice(0, 25)
    .map(
      (product) => `
        <tr>
          <td>${product.title}</td>
          <td>${product.brand ?? '-'}</td>
          <td>${product.currentPrice.toFixed(2)} €</td>
          <td>${product.originalPrice?.toFixed(2) ?? '-'} €</td>
          <td>${product.discountPercent?.toFixed(2) ?? '-'}%</td>
          <td><a href="${product.productUrl}">Ver producto</a></td>
        </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>eci-toys-deal-hunter report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; }
        table { width: 100%; border-collapse: collapse; }
        td, th { border: 1px solid #ccc; padding: 8px; text-align: left; }
      </style>
    </head>
    <body>
      <h1>Informe de scraping El Corte Inglés</h1>
      <p>Total escaneado: ${run.totalScanned}</p>
      <p>Total válidos: ${run.totalValid}</p>
      <p>Top descuentos detectados:</p>
      <table>
        <thead>
          <tr>
            <th>Título</th>
            <th>Marca</th>
            <th>Precio actual</th>
            <th>Precio anterior</th>
            <th>Descuento</th>
            <th>Enlace</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </body>
  </html>`;
};
