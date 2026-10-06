import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Field, Float, InputType, Int } from 'type-graphql';
import { RequestStatus } from '../../constants/appConstant';

@InputType({
  description: 'Input data for creating a reverse marketplace product request',
})
export class CreateRequestInput {
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Request title is required' })
  @MaxLength(200)
  title!: string;

  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  description!: string;

  @Field(() => Int, { defaultValue: 1 })
  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity!: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  subcategoryId?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  requiredWithinDays?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  deadline?: Date;

  @Field(() => [String], {
    nullable: true,
    description: 'Array of Media asset UUID references for attachments',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentMediaIds?: string[];
}

@InputType({
  description: 'Input data for updating an existing product request',
})
export class UpdateRequestInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  subcategoryId?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  requiredWithinDays?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  deadline?: Date;

  @Field(() => [String], {
    nullable: true,
    description: 'Array of Media asset UUID references for attachments',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentMediaIds?: string[];
}

@InputType({ description: 'Filter options for browsing requests' })
export class RequestFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  subcategoryId?: string;

  @Field(() => RequestStatus, { nullable: true })
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;
}
