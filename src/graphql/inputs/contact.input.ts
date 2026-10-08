import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Field, InputType } from 'type-graphql';
import { ContactStatus, ContactTopic } from '../../constants/appConstant';

@InputType({ description: 'Input for submitting a contact inquiry' })
export class CreateContactInput {
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100)
  name!: string;

  @Field()
  @IsEmail({}, { message: 'A valid email address is required' })
  @MaxLength(255)
  email!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  company?: string;

  @Field(() => ContactTopic)
  @IsEnum(ContactTopic)
  topic!: ContactTopic;

  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Message cannot be empty' })
  @MaxLength(5000)
  message!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  turnstileToken?: string;
}

@InputType({ description: 'Filter options for contact inquiries' })
export class ContactFilterInput {
  @Field(() => ContactTopic, { nullable: true })
  @IsOptional()
  topic?: ContactTopic;

  @Field(() => ContactStatus, { nullable: true })
  @IsOptional()
  status?: ContactStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;
}
