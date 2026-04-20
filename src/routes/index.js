import { Router } from 'express';
import { asyncHandler } from '../lib/async-handler.js';
import { HttpError } from '../lib/http-error.js';
import { logger } from '../lib/logger.js';
import { buildDispatchResult, delay } from '../lib/simulation.js';

export function createRouter({ scheduleCollapse, cancelCollapse, getServerState }) {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSec: Math.round(process.uptime()),
      serverState: getServerState()
    });
  });

  router.post('/simulate/dispatch', asyncHandler(async (req, res) => {
    const { payload, httpCode } = buildDispatchResult({
      ...req.body,
      correlationId: req.context?.correlationId
    });

    logger.info('dispatch.request.received', {
      requestId: payload.requestId,
      correlationId: payload.correlationId,
      scenarioType: payload.scenarioType,
      severity: payload.severity
    });

    await delay(payload.technicalDurationMs);

    logger.info('call.status.changed', {
      requestId: payload.requestId,
      correlationId: payload.correlationId,
      eventType: payload.telemetryEvent?.eventType,
      eventName: payload.telemetryEvent?.eventName,
      fromStage: payload.telemetryEvent?.fromStage,
      toOutcome: payload.telemetryEvent?.toOutcome,
      reason: payload.telemetryEvent?.reason
    });

    logger.info('dispatch.request.completed', {
      requestId: payload.requestId,
      correlationId: payload.correlationId,
      operatorOutcome: payload.outcome,
      technicalDurationMs: payload.technicalDurationMs,
      queueWaitSec: payload.queueWaitSec,
      callDurationSec: payload.callDurationSec
    });

    res.status(httpCode).json(payload);
  }));

  router.post('/simulate/collapse', asyncHandler(async (req, res) => {
    const delaySec = Number(req.body?.delaySec ?? 5);
    if (!Number.isFinite(delaySec) || delaySec < 0) {
      throw new HttpError(400, 'delaySec must be a non-negative number');
    }

    const cause = String(req.body?.cause ?? 'Power outage');
    scheduleCollapse({
      delaySec,
      cause,
      correlationId: req.context?.correlationId
    });

    res.json({
      scheduled: true,
      seconds: delaySec,
      collapseAt: new Date(Date.now() + delaySec * 1000).toISOString(),
      message: `Backend collapse scheduled: ${cause}`
    });
  }));

  router.delete('/simulate/collapse', asyncHandler(async (_req, res) => {
    cancelCollapse();
    res.json({
      scheduled: false,
      message: 'Scheduled backend collapse cleared.'
    });
  }));

  return router;
}
