import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AdminAuthSchema {
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Please enter your password' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;
}
