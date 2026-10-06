import { Field, ID, ObjectType } from 'type-graphql';
import { Role, UserMode } from '../../constants/appConstant';

@ObjectType({ description: 'User profile representation for all roles' })
export class UserProfileType {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  email?: string;

  @Field(() => Role)
  role: Role;

  @Field(() => UserMode)
  activeMode: UserMode;

  @Field({ defaultValue: false })
  hasSellerProfile: boolean;

  @Field()
  isEmailVerified: boolean;

  @Field({ defaultValue: false })
  isPhoneVerified: boolean;

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
