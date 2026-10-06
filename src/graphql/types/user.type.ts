import { Field, ID, ObjectType } from 'type-graphql';
import { Role } from '../../constants/appConstant';

@ObjectType({ description: 'User profile representation for all roles' })
export class UserProfileType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field(() => Role)
  role: Role;

  @Field()
  isEmailVerified: boolean;

  @Field({ defaultValue: false })
  isVendorVerified: boolean;

  @Field()
  isActive: boolean;

  @Field({ nullable: true })
  phoneNumber?: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field({ nullable: true })
  businessName?: string;

  @Field({ nullable: true })
  businessAddress?: string;

  @Field(() => Date)
  createdAt: Date;
}
