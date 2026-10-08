import { Field, Float, ID, Int, ObjectType } from 'type-graphql';
import { Role } from '../../constants/appConstant';

@ObjectType({ description: 'Customer details attached to user' })
export class CustomerSummaryType {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  shippingAddress?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  state?: string;

  @Field({ nullable: true })
  postalCode?: string;

  @Field({ nullable: true })
  country?: string;

  @Field({ nullable: true })
  preferences?: string;

  @Field({ nullable: true })
  notes?: string;
}

@ObjectType({ description: 'Vendor details attached to user' })
export class VendorSummaryType {
  @Field(() => ID)
  id: string;

  @Field()
  businessName: string;

  @Field({ nullable: true })
  businessRegistrationNumber?: string;

  @Field({ nullable: true })
  businessAddress?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  state?: string;

  @Field({ nullable: true })
  postalCode?: string;

  @Field({ nullable: true })
  country?: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  isVerified: boolean;

  @Field(() => Float)
  rating: number;

  @Field(() => Int)
  totalReviews: number;
}

@ObjectType({ description: 'User profile representation for all roles' })
export class UserProfileType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  email?: string;

  @Field(() => Role)
  role: Role;

  @Field()
  isEmailVerified: boolean;

  @Field({ nullable: true, defaultValue: false })
  isPhoneVerified?: boolean;

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

  @Field(() => CustomerSummaryType, { nullable: true })
  customer?: CustomerSummaryType;

  @Field(() => VendorSummaryType, { nullable: true })
  vendor?: VendorSummaryType;

  @Field(() => Date)
  createdAt: Date;
}

@ObjectType({ description: 'Paginated user management list' })
export class PaginatedUsersType {
  @Field(() => [UserProfileType])
  data: UserProfileType[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;
}
