import { Field, Int, ObjectType } from 'type-graphql';
import { ContactUsEntity } from '../../entities/contact-us/ContactUs.entity';

@ObjectType({ description: 'Paginated contact inquiries list' })
export class PaginatedContactsType {
  @Field(() => [ContactUsEntity])
  data: ContactUsEntity[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;
}
