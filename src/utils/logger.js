'use strict';

const LOG_LEVELS = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };
const COLORS = {
  error: '\x1b[31m',   // red
  warn:  '\x1b[33m',   // yellow
  info:  '\x1b[32m',   // green
  http:  '\x1b[36m',   // cyan
  debug: '\x1b[35m',   // magenta
  reset: '\x1b[0m',
};

const currentLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'debug';

const timestamp = () => new Date().toISOString();

const log = (level, message, meta = null) => {
  if (LOG_LEVELS[level] > LOG_LEVELS[currentLevel]) return;

  const color = COLORS[level] || '';
  const reset = COLORS.reset;
  const prefix = `${color}[${level.toUpperCase()}]${reset}`;
  const time = `\x1b[90m${timestamp()}\x1b[0m`;
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';

  const output = `${time} ${prefix} ${message}${metaStr}`;

  if (level === 'error' || level === 'warn') {
    console.error(output);
  } else {
    console.log(output);
  }
};

const logger = {
  error: (msg, meta) => log('error', msg, meta),
  warn:  (msg, meta) => log('warn', msg, meta),
  info:  (msg, meta) => log('info', msg, meta),
  http:  (msg, meta) => log('http', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
};

module.exports = logger;
