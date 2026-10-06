import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Field, InputType, Int } from 'type-graphql';

@InputType({
  description: 'Input data for directly purchasing a product from a vendor',
})
export class CreateDirectOrderInput {
  @Field()
  @IsUUID()
  @IsNotEmpty({ message: 'Product ID is required' })
  productId!: string;

  @Field(() => Int, { defaultValue: 1 })
  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity!: number;

  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Shipping address is required' })
  shippingAddress!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}
