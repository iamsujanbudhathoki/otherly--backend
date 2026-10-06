import http from 'http';
import express from 'express';
import depthLimit from 'graphql-depth-limit';
import 'reflect-metadata';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { AppDataSource } from './config/database.config';
import { DotenvConfig, Environment } from './config/env.config';
import { GraphQLContext } from './graphql/context';
import { createGraphQLSchema } from './graphql/schema';
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
      .then(async () => {
        console.log('Data Source has been initialized!');
        const app = express();
        const httpServer = http.createServer(app);

        // Build GraphQL schema
        const schema = await createGraphQLSchema();

        // Initialize Apollo Server with security hardening
        const apolloServer = new ApolloServer<GraphQLContext>({
          schema,
          plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
          validationRules: [depthLimit(7)],
          introspection: DotenvConfig.NODE_ENV !== Environment.PRODUCTION,
          formatError: (formattedError) => {
            if (DotenvConfig.NODE_ENV === Environment.PRODUCTION) {
              return {
                message: formattedError.message || 'Internal server error',
                extensions: {
                  code:
                    formattedError.extensions?.code || 'INTERNAL_SERVER_ERROR',
                },
              };
            }
            return formattedError;
          },
        });
        await apolloServer.start();

        // Configure Express & GraphQL middlewares
        configMiddleware(app, apolloServer);

        new RedisUtil().initialize();

        httpServer.listen(DotenvConfig.PORT, () => {
          console.log(
            `Marketplace API server running on http://localhost:${DotenvConfig.PORT}`,
          );
          console.log(
            `GraphQL endpoint available at http://localhost:${DotenvConfig.PORT}/graphql`,
          );
        });

        // Graceful shutdown
        const handleShutdown = async (signal: string) => {
          console.log(`Received ${signal}. Initiating graceful shutdown...`);
          httpServer.close(async () => {
            console.log('HTTP server closed.');
            await apolloServer.stop();
            console.log('Apollo Server stopped.');
            if (AppDataSource.isInitialized) {
              await AppDataSource.destroy();
              console.log('Database connection closed.');
            }
            process.exit(0);
          });
        };

        process.on('SIGTERM', () => handleShutdown('SIGTERM'));
        process.on('SIGINT', () => handleShutdown('SIGINT'));
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
