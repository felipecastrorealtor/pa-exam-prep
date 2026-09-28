/**
 * Netlify Function: retention-sweep  (scheduled daily — see netlify.toml)
 *
 * The sweep itself lives in lib/retention/sweep.ts so that this function and
 * the Vercel cron route at /api/cron/retention-sweep run the same code.
 * This file is only the Netlify entry point.
 *
 * Endpoint (for a manual run): /.netlify/functions/retention-sweep
 */

import type { Handler } from '@netlify/functions'
import { runRetentionSweep } from '../../lib/retention/sweep'

export const handler: Handler = async () => {
  try {
    const summary = await runRetentionSweep()
    return { statusCode: 200, body: JSON.stringify(summary) }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[retention]', message)
    return { statusCode: 500, body: JSON.stringify({ error: message }) }
  }
}
