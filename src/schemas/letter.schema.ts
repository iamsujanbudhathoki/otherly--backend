import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { LetterKind } from '../constants/appConstant';

export class LetterSectionSchema {
  @IsOptional()
  @IsString()
  heading?: string;

  @IsArray()
  @IsString({ each: true })
  paragraphs!: string[];
}

export class CreateLetterSchema {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  slug!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  number!: string;

  @IsEnum(LetterKind)
  kind!: LetterKind;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  date!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  readTime!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  image!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LetterSectionSchema)
  content!: LetterSectionSchema[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  author!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  authorTitle!: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateLetterSchema {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  number?: string;

  @IsOptional()
  @IsEnum(LetterKind)
  kind?: LetterKind;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  readTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  image?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LetterSectionSchema)
  content?: LetterSectionSchema[];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  author?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  authorTitle?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
