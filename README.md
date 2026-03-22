# eci-toys-deal-hunter

MVP en Next.js para detectar juguetes rebajados en El Corte Inglés, persistir oportunidades localmente y exportarlas en CSV, JSON y HTML.

## Stack

- Next.js App Router
- TypeScript estricto
- Tailwind CSS
- Prisma + SQLite
- Playwright para scraping
- Zod para validación

## Arquitectura

```text
src/
  app/
    api/
    dashboard/
  db/
  lib/
  modules/
    deals/
    reports/
    scheduler/
    scraping/
  types/
```

Separación principal:

- `scraper`: navegación Playwright y reintentos.
- `parser`: normalización y lectura de JSON-LD/fallback DOM.
- `storage`: persistencia Prisma/SQLite.
- `report generator`: salidas CSV, JSON y HTML.
- `business rules`: scoring, deduplicado y exclusiones.

## Variables de entorno

Copia `.env.example` a `.env`.

```bash
DATABASE_URL="file:./dev.db"
SCRAPER_BASE_URL="https://www.elcorteingles.es"
SCRAPER_CATEGORY_PATH="/juguetes/ofertas"
SCRAPER_USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
```

## Instalación

```bash
npm install
npx prisma generate
npx prisma db push
npx playwright install chromium
npm run dev
```

## Uso

### Dashboard

- `GET /dashboard`
- filtros por descuento mínimo, marca y disponibilidad
- botón para lanzar scrape manual
- exportes CSV, JSON y HTML

### API

- `GET /api/deals`
- `POST /api/scrape/run`
- `GET /api/reports/csv`
- `GET /api/reports/json`

### Scrape manual por CLI

```bash
npm run scrape
```

## Configuración inicial

- `minDiscountPercent = 35`
- `category = juguetes`
- `maxPagesToScan = 20`
- `onlyInStock = true`

## Reglas de negocio implementadas

- guarda solo productos con descuento >= umbral mínimo
- ignora productos sin URL válida o precio actual
- deduplica por `productUrl`
- marca confianza baja si no puede verificar descuento con claridad
- intenta excluir marketplace mediante señales de seller/vendor

## Limitaciones actuales

- la estructura de El Corte Inglés puede variar y exigir ajustes de selectores/JSON-LD
- algunas páginas pueden activar mecanismos anti-bot que requieran proxies, rotación de fingerprints o sesiones persistentes
- el endpoint de categoría de ejemplo puede necesitar adaptación si la ruta real cambia
- la exportación HTML se genera desde el último scrape persistido

## Siguientes pasos recomendados

1. añadir snapshots de páginas y métricas de bloqueo por ejecución
2. programador recurrente con cron/queue
3. caché incremental y notificaciones
4. matcher de marketplace Amazon, fee calculator y ROI scorer
