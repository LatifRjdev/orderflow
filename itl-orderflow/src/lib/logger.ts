type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getMinLevel(): number {
  return process.env.NODE_ENV === "production" ? LOG_LEVELS.warn : LOG_LEVELS.debug;
}

function formatMessage(level: LogLevel, context: string, message: string, meta?: unknown): string {
  const timestamp = new Date().toISOString();
  const base = `${timestamp} [${level.toUpperCase()}] [${context}] ${message}`;
  return meta ? `${base} ${JSON.stringify(meta)}` : base;
}

function createLogger(context: string) {
  return {
    debug(message: string, meta?: unknown) {
      if (getMinLevel() <= LOG_LEVELS.debug) {
        console.debug(formatMessage("debug", context, message, meta));
      }
    },
    info(message: string, meta?: unknown) {
      if (getMinLevel() <= LOG_LEVELS.info) {
        console.info(formatMessage("info", context, message, meta));
      }
    },
    warn(message: string, meta?: unknown) {
      if (getMinLevel() <= LOG_LEVELS.warn) {
        console.warn(formatMessage("warn", context, message, meta));
      }
    },
    error(message: string, meta?: unknown) {
      if (getMinLevel() <= LOG_LEVELS.error) {
        console.error(formatMessage("error", context, message, meta));
      }
    },
  };
}

export const logger = {
  create: createLogger,
};
