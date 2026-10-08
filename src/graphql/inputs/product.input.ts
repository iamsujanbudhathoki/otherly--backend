import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Field, Float, InputType, Int } from 'type-graphql';

@InputType({ description: 'Input data for listing a new marketplace product' })
export class CreateProductInput {
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Product title is required' })
  @MaxLength(200)
  title!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(220)
  slug?: string;

  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Product description is required' })
  description!: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0, { message: 'Price cannot be negative' })
  price!: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  subcategoryId?: string;

  @Field(() => [String], {
    nullable: true,
    description: 'Array of Media asset UUID references for product images',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageMediaIds?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @Field({ nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@InputType({ description: 'Input data for updating an existing product' })
export class UpdateProductInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(220)
  slug?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  subcategoryId?: string;

  @Field(() => [String], {
    nullable: true,
    description: 'Array of Media asset UUID references for product images',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageMediaIds?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@InputType({ description: 'Filter options for querying products' })
export class ProductFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  subcategoryId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  inStockOnly?: boolean;

  @Field({ nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  activeOnly?: boolean;

  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @Field(() => Int, { nullable: true, defaultValue: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}
