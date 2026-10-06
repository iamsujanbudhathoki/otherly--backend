import path from 'path';
import { GraphQLSchema } from 'graphql';
import { container } from 'tsyringe';
import { buildSchema } from 'type-graphql';
import { DotenvConfig, Environment } from '../config/env.config';
import { customAuthChecker } from './auth/authChecker';
import { registerEnums } from './enums';
import { AuthResolver } from './resolvers/auth.resolver';
import { CategoryResolver } from './resolvers/category.resolver';
import { CustomerResolver } from './resolvers/customer.resolver';
import { HealthResolver } from './resolvers/health.resolver';
import { MediaResolver } from './resolvers/media.resolver';
import { OfferResolver } from './resolvers/offer.resolver';
import { OrderResolver } from './resolvers/order.resolver';
import { ProductResolver } from './resolvers/product.resolver';
import { RequestResolver } from './resolvers/request.resolver';
import { VendorResolver } from './resolvers/vendor.resolver';

export async function createGraphQLSchema(): Promise<GraphQLSchema> {
  // Register all custom enums
  registerEnums();

  // Build executable GraphQL schema with tsyringe DI and auth checker
  return await buildSchema({
    resolvers: [
      HealthResolver,
      AuthResolver,
      CustomerResolver,
      VendorResolver,
      CategoryResolver,
      ProductResolver,
      RequestResolver,
      OfferResolver,
      OrderResolver,
      MediaResolver,
    ],
    container: {
      get: (cls) => container.resolve(cls),
    },
    authChecker: customAuthChecker,
    validate: true,
    emitSchemaFile:
      DotenvConfig.NODE_ENV === Environment.DEVELOPMENT
        ? path.resolve(process.cwd(), 'schema.gql')
        : false,
  });
}
