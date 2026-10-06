import { Field, ID, ObjectType } from 'type-graphql';
import { Role } from '../../constants/appConstant';
import { AdminPermission } from '../../entities/admin/Admin.entity';

@ObjectType({ description: 'Admin user profile details' })
export class AdminProfileType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field(() => Role)
  role: Role;

  @Field(() => [AdminPermission])
  permissions: AdminPermission[];

  @Field()
  isActive: boolean;
}
