const attempts = new Map<string, { count: number; resetAt: number }>();

// Periodic cleanup of expired entries (every 5 minutes)
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    attempts.forEach((entry, key) => {
      if (now > entry.resetAt) {
        attempts.delete(key);
      }
    });
  }, 5 * 60 * 1000);
  // Don't prevent process exit
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
}

/**
 * In-memory rate limiter.
 * Returns { allowed: true } if under limit, or { allowed: false, retryAfterMs } if over.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterMs?: number } {
  ensureCleanup();

  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true };
}
