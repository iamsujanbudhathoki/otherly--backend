import path from 'path';
import { DataSource } from 'typeorm';
import { DotenvConfig, Environment } from './env.config';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: DotenvConfig.DB_HOST,
  port: +DotenvConfig.DB_PORT,
  username: DotenvConfig.DB_USERNAME,
  password: DotenvConfig.DB_PASSWORD,
  database: DotenvConfig.DB_NAME,
  entities: [path.join(__dirname, '../entities/**/*.entity.{ts,js}')],
  synchronize: DotenvConfig.NODE_ENV !== Environment.PRODUCTION,
  ssl:
    DotenvConfig.DB_SSL || DotenvConfig.NODE_ENV === Environment.PRODUCTION
      ? { rejectUnauthorized: false }
      : false,
});
