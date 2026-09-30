import dotenv from 'dotenv';
import path from 'path';

export enum Environment {
  DEVELOPMENT = 'DEVELOPMENT',
  PRODUCTION = 'PRODUCTION',
  TEST = 'TEST',
}

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

class DotenvConfig {
  // APP
  static PORT = Number(process.env.PORT) || 4000;
  static NODE_ENV =
    (process.env.NODE_ENV?.toUpperCase() as Environment) ||
    Environment.DEVELOPMENT;

  // AUTH / JWT
  static JWT_SECRET =
    process.env.JWT_SECRET || 'stradmont-solutions-jwt-secret-key-2026';
  static JWT_ACCESS_EXPIRES_SECONDS =
    Number(process.env.JWT_ACCESS_EXPIRES_SECONDS) || 60 * 60 * 24; // 24 hours
  static JWT_REFRESH_EXPIRES_SECONDS =
    Number(process.env.JWT_REFRESH_EXPIRES_SECONDS) || 60 * 60 * 24 * 7; // 7 days

  // CLOUDFLARE TURNSTILE
  static TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || '';

  // DB
  static DB_TYPE = process.env.DB_TYPE || 'postgres';
  static DB_HOST = process.env.DB_HOST || 'localhost';
  static DB_PORT = Number(process.env.DB_PORT) || 5432;
  static DB_USERNAME = process.env.DB_USERNAME || 'postgres';
  static DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
  static DB_NAME = process.env.DB_NAME || 'stradmont_solutions';
  static DB_SSL = process.env.DB_SSL === 'true';

  // REDIS
  static REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';
  static REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

  // MAIL
  static MAIL_HOST = process.env.MAIL_HOST || '';
  static MAIL_PORT = Number(process.env.MAIL_PORT) || 587;
  static MAIL_USER = process.env.MAIL_USER || '';
  static MAIL_PASSWORD =
    process.env.MAIL_PASSWORD || process.env.MAIL_PASS || '';
  static MAIL_FROM =
    process.env.MAIL_FROM ||
    process.env.MAIL_USER ||
    'info@stradmontsolutions.com';
  static ADMIN_NOTIFICATION_EMAIL =
    process.env.ADMIN_NOTIFICATION_EMAIL || 'info@stradmontsolutions.com';

  // LOG
  static LOG_LEVEL = process.env.LOG_LEVEL || 'info';

  // URL
  static FRONTEND_BASE_URL =
    process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
  static BASE_URL = process.env.BASE_URL || `http://localhost:${this.PORT}`;

  // MEDIA
  static MEDIA_UPLOAD_PATH =
    process.env.MEDIA_UPLOAD_PATH ||
    path.resolve(process.cwd(), 'public/uploads');
  static MEDIA_TEMP_PATH =
    process.env.MEDIA_TEMP_PATH ||
    path.resolve(process.cwd(), 'public/uploads/temp');
}

export { DotenvConfig };
