import { Field, ObjectType, Query, Resolver } from 'type-graphql';

@ObjectType({ description: 'GraphQL Server Status Information' })
class ServerStatus {
  @Field()
  status: string;

  @Field()
  timestamp: string;

  @Field()
  service: string;
}

@Resolver()
export class HealthResolver {
  @Query(() => String, { description: 'Simple ping health check' })
  ping(): string {
    return 'pong';
  }

  @Query(() => ServerStatus, { description: 'Detailed health status' })
  serverStatus(): ServerStatus {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Otherly GraphQL API',
    };
  }
}
