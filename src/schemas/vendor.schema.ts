import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class OnboardIndividualSellerSchema {
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName!: string;

  @IsString()
  @IsNotEmpty({ message: 'PAN number is required' })
  panNumber!: string;

  @IsEmail({}, { message: 'A valid email address is required' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;
}

export class OnboardCompanySellerSchema {
  @IsString()
  @IsNotEmpty({ message: 'Company name is required' })
  companyName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Address is required' })
  address!: string;

  @IsString()
  @IsNotEmpty({ message: 'PAN number is required' })
  panNumber!: string;

  @IsArray({ message: 'documentMediaIds must be an array of media IDs' })
  @IsString({
    each: true,
    message: 'Each document media ID must be a valid string UUID',
  })
  @IsOptional()
  documentMediaIds?: string[];
}
