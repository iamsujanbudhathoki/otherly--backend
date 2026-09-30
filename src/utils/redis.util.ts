import Redis from 'ioredis';
import { DotenvConfig } from '../config/env.config';
import { logger } from '../config/logger.config';

class RedisUtil {
  static redis: Redis | null = null;

  initialize() {
    if (!DotenvConfig.REDIS_ENABLED) {
      return;
    }

    try {
      RedisUtil.redis = new Redis(DotenvConfig.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 3,
      });

      RedisUtil.redis.on('error', (err) => {
        logger.warn(`Redis connection warning: ${err.message}`);
      });

      RedisUtil.redis.connect().catch((err) => {
        logger.warn(
          `Redis unavailable, continuing without cache: ${err.message}`,
        );
      });
    } catch (err: any) {
      logger.warn(`Failed to initialize Redis: ${err?.message}`);
    }
  }
}

export { RedisUtil };
