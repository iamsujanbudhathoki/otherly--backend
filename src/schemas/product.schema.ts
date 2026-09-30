import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateProductSchema {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  slug!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  tag!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  status!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  logo!: string;

  @IsString()
  @IsUrl({}, { message: 'Please provide a valid URL' })
  @MaxLength(500)
  url!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProductSchema {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  tag?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logo?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Please provide a valid URL' })
  @MaxLength(500)
  url?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
