const requiredEnvVars = ["DATABASE_URL", "AUTH_SECRET"] as const;

const requiredInProduction = ["NEXT_PUBLIC_APP_URL", "CRON_SECRET"] as const;

const optionalWithWarning = ["RESEND_API_KEY"] as const;

export function validateEnv() {
  const missing: string[] = [];

  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (process.env.NODE_ENV === "production") {
    for (const key of requiredInProduction) {
      if (!process.env[key]) {
        missing.push(key);
      }
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  for (const key of optionalWithWarning) {
    if (!process.env[key]) {
      console.warn(`[env] Warning: ${key} is not set`);
    }
  }
}
