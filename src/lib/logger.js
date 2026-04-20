function write(level, message, data = {}) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...sanitize(data)
  };

  const line = JSON.stringify(payload);
  if (level === 'error' || level === 'fatal') {
    console.error(line);
  } else {
    console.log(line);
  }
}

function sanitize(data) {
  const clone = { ...data };
  if (clone.err instanceof Error) {
    clone.err = {
      name: clone.err.name,
      message: clone.err.message,
      stack: clone.err.stack
    };
  }
  return clone;
}

export const logger = {
  debug: (message, data) => write('debug', message, data),
  info: (message, data) => write('info', message, data),
  warn: (message, data) => write('warn', message, data),
  error: (message, data) => write('error', message, data),
  fatal: (message, data) => write('fatal', message, data)
};
