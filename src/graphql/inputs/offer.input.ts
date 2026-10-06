import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Field, Float, InputType, Int } from 'type-graphql';
import { OfferFulfillType } from '../../constants/appConstant';

@InputType({
  description:
    'Input data for submitting a vendor offer/quote on a customer request',
})
export class SubmitOfferInput {
  @Field()
  @IsUUID()
  @IsNotEmpty({ message: 'Request ID is required' })
  requestId!: string;

  @Field(() => Int)
  @IsNumber()
  @Min(1, { message: 'Offered quantity must be at least 1' })
  offeredQuantity!: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0, { message: 'Unit price cannot be negative' })
  unitPrice!: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalPrice?: number;

  @Field(() => Int, { nullable: true, defaultValue: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  deliveryDays?: number;

  @Field(() => OfferFulfillType, {
    nullable: true,
    defaultValue: OfferFulfillType.IN_STOCK,
  })
  @IsOptional()
  @IsEnum(OfferFulfillType)
  fulfillType?: OfferFulfillType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}
