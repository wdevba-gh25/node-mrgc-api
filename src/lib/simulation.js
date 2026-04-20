import crypto from 'node:crypto';

const operatorPool = ['J. ALVAREZ', 'H. MENDEZ', 'R. PATERSON', 'M. SINGH', 'A. ROMERO', 'T. NGUYEN'];

export function buildDispatchResult(body = {}) {
  const now = new Date();
  const requestId = body.requestId ?? `REQ-${crypto.randomUUID().slice(0, 8)}`;
  const correlationId = body.correlationId ?? crypto.randomUUID();
  const scenarioType = body.scenarioType ?? 'Major incident';
  const severity = body.severity ?? 'Normal';
  const degradedUpstream = Boolean(body.degradedUpstream);
  const intermittentTimeout = Boolean(body.intermittentTimeout);
  const failedRefreshBurst = Boolean(body.failedRefreshBurst);
  const callerId = body.callerId ?? buildCallerId();
  const plannedOutcome = body.plannedOutcome;

  let technicalDurationMs = randomBetween(180, 520);
  if (severity === 'Degraded') technicalDurationMs = randomBetween(420, 1300);
  if (severity === 'Severe' || severity === 'Critical') technicalDurationMs = randomBetween(900, 2200);
  if (degradedUpstream) technicalDurationMs += randomBetween(180, 600);

  let outcome = 'Completed';
  let httpCode = 200;
  let queueWaitSec = randomBetween(3, 5);
  let callDurationSec = randomBetween(12, 30);
  let operatorName = pickOperator(requestId);
  let notes = `Processed ${scenarioType} request under ${severity.toLowerCase()} conditions.`;
  let telemetryEvent;

  const forcedOutcome = normalizeOutcome(plannedOutcome);

  if (forcedOutcome === 'Timed Out' || (!forcedOutcome && intermittentTimeout && Math.random() < 0.2)) {
    outcome = 'Timed Out';
    httpCode = 504;
    technicalDurationMs = 5000 + randomBetween(0, 40);
    queueWaitSec = 5;
    callDurationSec = 0;
    operatorName = null;
    notes = 'Call reached intake but no operator became available before timeout.';
    telemetryEvent = {
      eventType: 'CustomEvent',
      eventName: 'CallStatusChanged',
      fromStage: 'Routing...',
      toOutcome: 'Timed Out',
      reason: 'OperatorUnavailable'
    };
  } else if (forcedOutcome === 'Failed' || (!forcedOutcome && failedRefreshBurst && Math.random() < 0.25)) {
    outcome = 'Failed';
    httpCode = 502;
    technicalDurationMs = randomBetween(240, 780);
    callDurationSec = randomBetween(5, 10);
    notes = 'Operator was engaged but the live call was interrupted before dispatch completion.';
    telemetryEvent = {
      eventType: 'CustomEvent',
      eventName: 'CallStatusChanged',
      fromStage: 'Call connected',
      toOutcome: 'Failed',
      reason: 'ExternalInterruption'
    };
  } else {
    outcome = 'Completed';
    telemetryEvent = {
      eventType: 'CustomEvent',
      eventName: 'CallStatusChanged',
      fromStage: 'Call connected',
      toOutcome: 'Completed',
      reason: 'DispatchCompleted'
    };
  }

  return {
    httpCode,
    payload: {
      requestId,
      callerId,
      receivedAt: now.toISOString(),
      answeredAt: outcome === 'Timed Out' ? null : new Date(now.getTime() + 3000).toISOString(),
      endedAt: outcome === 'Timed Out' ? null : new Date(now.getTime() + callDurationSec * 1000).toISOString(),
      technicalFinishedAt: new Date(now.getTime() + technicalDurationMs).toISOString(),
      technicalDurationMs,
      queueWaitSec,
      callDurationSec,
      outcome,
      operatorName,
      correlationId,
      notes,
      telemetryEvent,
      scenarioType,
      severity
    }
  };
}

function normalizeOutcome(value) {
  if (value === 'Timed Out' || value === 'Failed' || value === 'Completed') return value;
  return null;
}

function pickOperator(seed) {
  const index = seed.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % operatorPool.length;
  return operatorPool[index];
}

export function buildCallerId() {
  return `11${randomBetween(100000000, 999999999)}`;
}

export function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
