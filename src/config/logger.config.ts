import winston, { format } from 'winston';
import { DotenvConfig, Environment } from './env.config';

const { timestamp, combine, errors, json } = format;

let transports: (
  | winston.transports.ConsoleTransportInstance
  | winston.transports.FileTransportInstance
)[];

if (DotenvConfig.NODE_ENV === Environment.DEVELOPMENT) {
  transports = [new winston.transports.Console()];
} else {
  transports = [
    new winston.transports.File({ filename: 'public/logs/log.json' }),
  ];
}

const logger = winston.createLogger({
  level: DotenvConfig.LOG_LEVEL,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm' }),
    errors({ stack: true }),
    json(),
  ),
  transports,
});

export { logger };
