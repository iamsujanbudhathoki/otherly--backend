import { Field, Int, ObjectType } from 'type-graphql';
import { ProductEntity } from '../../entities/product/Product.entity';

@ObjectType({ description: 'Paginated marketplace products response' })
export class PaginatedProductsType {
  @Field(() => [ProductEntity])
  data: ProductEntity[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;
}
