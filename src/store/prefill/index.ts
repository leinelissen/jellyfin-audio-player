/**
 * Prefill Module
 * 
 * Coordinates the complete prefill process for a source
 */

export * from './orchestrator';
export * from './task-graph';

import { PrefillOrchestrator, PrefillProgressCallback } from './orchestrator';
import { PrefillTaskGraph } from './task-graph';
import { SourceDriver } from '../sources/types';

/**
 * Run complete prefill for a source
 * 
 * This executes the full prefill workflow:
 * 1. Artists and Albums (parallel)
 * 2. Playlists
 * 3. Album tracks and Playlist tracks (parallel)
 * 4. Similar albums and Lyrics (parallel)
 */
export async function runPrefill(
  sourceId: string,
  driver: SourceDriver,
  onProgress?: PrefillProgressCallback
): Promise<void> {
  console.log(`Starting prefill for source ${sourceId}`);

  // Phase 1: Basic entities
  const orchestrator = new PrefillOrchestrator(sourceId, driver, onProgress);
  await orchestrator.prefillAll();

  // Phase 2: Dependent tasks
  const taskGraph = new PrefillTaskGraph(sourceId, driver, onProgress);
  await taskGraph.runAll();

  console.log(`Prefill completed for source ${sourceId}`);
}
