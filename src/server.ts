import express from 'express';
import 'reflect-metadata';
import { AppDataSource } from './config/database.config';
import { DotenvConfig } from './config/env.config';
import { configMiddleware } from './middlewares';
import { PathUtils } from './utils/path.util';
import { RedisUtil } from './utils/redis.util';

class Server {
  constructor() {
    this.bootstrap();
  }

  async bootstrap() {
    await this.initializePath();
    AppDataSource.initialize()
      .then(() => {
        console.log('Data Source has been initialized!');
        const app = express();
        configMiddleware(app);
        new RedisUtil().initialize();
        app.listen(DotenvConfig.PORT, () => {
          console.log(
            `Stradmont Solutions API server running on http://localhost:${DotenvConfig.PORT}`,
          );
        });
      })
      .catch((err) => {
        console.error('Error during Data Source initialization', err);
      });
  }

  async initializePath() {
    await PathUtils.ensureDir(DotenvConfig.MEDIA_TEMP_PATH);
    await PathUtils.ensureDir(DotenvConfig.MEDIA_UPLOAD_PATH);
  }
}

new Server();
