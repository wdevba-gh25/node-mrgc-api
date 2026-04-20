import express from 'express';
import cors from 'cors';
import { createRouter } from './routes/index.js';
import { logger } from './lib/logger.js';
import { requestContextMiddleware } from './middleware/request-context.js';
import { httpLoggerMiddleware } from './middleware/http-logger.js';
import { notFoundMiddleware } from './middleware/not-found.js';
import { errorHandlerMiddleware } from './middleware/error-handler.js';

const app = express();
const port = Number(process.env.PORT || 4001);

let collapseTimer = null;
let collapseInfo = null;
let serverState = 'healthy';

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(requestContextMiddleware);
app.use(httpLoggerMiddleware);

app.use(createRouter({
  scheduleCollapse,
  cancelCollapse,
  getServerState: () => ({
    mode: serverState,
    scheduledCollapse: collapseInfo
  })
}));

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const server = app.listen(port, () => {
  logger.info('server.started', { port, pid: process.pid });
  console.log(`Emergency surge API listening on port ${port}`);
});

function scheduleCollapse({ delaySec, cause, correlationId }) {
  if (collapseTimer) {
    clearTimeout(collapseTimer);
  }

  const delayMs = Math.max(0, Math.round(delaySec * 1000));
  serverState = 'collapse_scheduled';
  collapseInfo = {
    cause,
    delaySec,
    correlationId,
    scheduledAt: new Date().toISOString()
  };

  logger.warn('server.collapse.scheduled', {
    cause,
    delaySec,
    correlationId
  });

  collapseTimer = setTimeout(() => {
    serverState = 'offline';
    logger.fatal('server.collapse.executing', {
      cause,
      correlationId
    });

    setTimeout(() => {
      process.exit(1);
    }, 25);
  }, delayMs);
}


function cancelCollapse() {
  if (collapseTimer) {
    clearTimeout(collapseTimer);
    collapseTimer = null;
  }
  collapseInfo = null;
  if (serverState !== 'offline') {
    serverState = 'healthy';
  }
  logger.info('server.collapse.cleared');
}

function shutdown(signal) {
  logger.warn('server.shutdown.requested', { signal });
  server.close(() => {
    logger.info('server.shutdown.completed', { signal });
    process.exit(0);
  });

  setTimeout(() => {
    logger.fatal('server.shutdown.forced', { signal });
    process.exit(1);
  }, 3000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('uncaughtException', (err) => {
  logger.fatal('process.uncaughtException', { err });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.fatal('process.unhandledRejection', {
    err: reason instanceof Error ? reason : new Error(String(reason))
  });
  process.exit(1);
});
