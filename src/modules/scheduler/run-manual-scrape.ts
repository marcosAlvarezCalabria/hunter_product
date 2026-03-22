import { ScrapeOrchestrator } from '@/modules/scheduler/scrape-orchestrator';

const main = async () => {
  const orchestrator = new ScrapeOrchestrator();
  const response = await orchestrator.run();
  console.log(JSON.stringify({
    scanned: response.result.scanned,
    kept: response.result.kept,
    runId: response.persisted.scrapeRun.id,
  }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
