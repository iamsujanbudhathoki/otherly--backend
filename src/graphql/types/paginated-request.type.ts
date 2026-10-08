import { Field, Int, ObjectType } from 'type-graphql';
import { RequestEntity } from '../../entities/request/Request.entity';

@ObjectType({ description: 'Paginated buyer product requests response' })
export class PaginatedRequestsType {
  @Field(() => [RequestEntity])
  data: RequestEntity[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;
}
