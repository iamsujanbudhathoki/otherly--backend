import path from 'path';
import { DataSource } from 'typeorm';
import { DotenvConfig } from './env.config';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: DotenvConfig.DATABASE_URL,
  entities: [path.join(__dirname, '../entities/**/*.entity.{ts,js}')],
  synchronize: DotenvConfig.DB_SYNCHRONIZE,
  ssl: DotenvConfig.DB_SSL ? { rejectUnauthorized: false } : false,
});
