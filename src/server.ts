import http from 'http';
import express from 'express';
import depthLimit from 'graphql-depth-limit';
import 'reflect-metadata';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { AppDataSource } from './config/database.config';
import { DotenvConfig } from './config/env.config';
import { GraphQLContext } from './graphql/context';
import { formatGraphQLError } from './graphql/formatError';
import { createGraphQLSchema } from './graphql/schema';
import { configMiddleware } from './middlewares';
import { RedisUtil } from './utils/redis.util';

class Server {
  constructor() {
    this.bootstrap();
  }

  async bootstrap() {
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
          plugins: [
            ApolloServerPluginDrainHttpServer({ httpServer }),
            ApolloServerPluginLandingPageLocalDefault({ embed: true }),
          ],
          validationRules: [depthLimit(7)],
          introspection: true,
          formatError: (formattedError, error) =>
            formatGraphQLError(formattedError, error),
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

        process.on('unhandledRejection', (reason, promise) => {
          console.error(
            'Unhandled Promise Rejection at:',
            promise,
            'reason:',
            reason,
          );
        });

        process.on('uncaughtException', (error) => {
          console.error('Uncaught Exception thrown:', error);
        });
      })
      .catch((err) => {
        console.error('Error during Data Source initialization', err);
        process.exit(1);
      });
  }
}

new Server();
