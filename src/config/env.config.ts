import dotenv from 'dotenv';
import path from 'path';

export enum Environment {
  DEVELOPMENT = 'DEVELOPMENT',
  PRODUCTION = 'PRODUCTION',
  TEST = 'TEST',
}

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function getRequired(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `Configuration Error: Required environment variable "${name}" is missing.`,
    );
  }
  return value.trim();
}

function getRequiredNumber(name: string): number {
  const raw = getRequired(name);
  const parsed = Number(raw);
  if (isNaN(parsed)) {
    throw new Error(
      `Configuration Error: Environment variable "${name}" must be a valid number, got "${raw}".`,
    );
  }
  return parsed;
}

function getRequiredBoolean(name: string): boolean {
  const raw = getRequired(name).toLowerCase();
  if (raw === 'true') {
    return true;
  }
  if (raw === 'false') {
    return false;
  }
  throw new Error(
    `Configuration Error: Environment variable "${name}" must be "true" or "false", got "${raw}".`,
  );
}

function getOptional(name: string): string | undefined {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    return undefined;
  }
  return value.trim();
}

function getOptionalNumber(name: string): number | undefined {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    return undefined;
  }
  const parsed = Number(value.trim());
  if (isNaN(parsed)) {
    throw new Error(
      `Configuration Error: Environment variable "${name}" must be a valid number, got "${value}".`,
    );
  }
  return parsed;
}

class DotenvConfig {
  // APP
  static PORT = getRequiredNumber('PORT');
  static NODE_ENV =
    Environment[getRequired('NODE_ENV') as keyof typeof Environment];

  // AUTH / JWT
  static JWT_SECRET = getRequired('JWT_SECRET');
  static JWT_ACCESS_EXPIRES_SECONDS = getRequiredNumber(
    'JWT_ACCESS_EXPIRES_SECONDS',
  );
  static JWT_REFRESH_EXPIRES_SECONDS = getRequiredNumber(
    'JWT_REFRESH_EXPIRES_SECONDS',
  );

  // CLOUDFLARE TURNSTILE
  static TURNSTILE_SECRET_KEY = getRequired('TURNSTILE_SECRET_KEY');

  // DATABASE
  static DATABASE_URL = getRequired('DATABASE_URL');
  static DB_SSL = getRequiredBoolean('DB_SSL');
  static DB_SYNCHRONIZE = getRequiredBoolean('DB_SYNCHRONIZE');

  // REDIS
  static REDIS_ENABLED = getRequiredBoolean('REDIS_ENABLED');
  static REDIS_URL = getRequired('REDIS_URL');

  // MAIL
  static MAIL_HOST = getOptional('MAIL_HOST');
  static MAIL_PORT = getOptionalNumber('MAIL_PORT');
  static MAIL_USER = getOptional('MAIL_USER');
  static MAIL_PASSWORD = getOptional('MAIL_PASSWORD');
  static MAIL_FROM = getRequired('MAIL_FROM');
  static ADMIN_NOTIFICATION_EMAIL = getRequired('ADMIN_NOTIFICATION_EMAIL');

  // LOG
  static LOG_LEVEL = getRequired('LOG_LEVEL');

  // URL
  static FRONTEND_BASE_URL = getRequired('FRONTEND_BASE_URL');
  static BASE_URL = getRequired('BASE_URL');

  // SUPABASE STORAGE
  static SUPABASE_URL = getRequired('SUPABASE_URL');
  static SUPABASE_KEY = getRequired('SUPABASE_KEY');
  static SUPABASE_STORAGE_BUCKET = getRequired('SUPABASE_STORAGE_BUCKET');
}

export { DotenvConfig };
