import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ContactStatus, ContactTopic } from '../constants/appConstant';

export class CreateContactSchema {
  @IsString()
  @IsNotEmpty({ message: 'Please enter your name' })
  @MaxLength(100, { message: 'Name must be 100 characters or fewer' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Please enter your email' })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @MaxLength(255, { message: 'Email must be 255 characters or fewer' })
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'Company name must be 120 characters or fewer' })
  company?: string;

  @IsEnum(ContactTopic, { message: 'Please select a valid topic' })
  topic!: ContactTopic;

  @IsString()
  @IsNotEmpty({ message: 'Please enter a message' })
  @MinLength(10, { message: 'Tell us a little more (minimum 10 characters)' })
  @MaxLength(1000, { message: 'Message must be 1000 characters or fewer' })
  message!: string;

  @IsOptional()
  @IsString()
  turnstileToken?: string;
}

export class UpdateContactStatusSchema {
  @IsEnum(ContactStatus, { message: 'Please provide a valid contact status' })
  status!: ContactStatus;
}
