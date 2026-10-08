import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { Role } from '../constants/appConstant';

export class RegisterSchema {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name!: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @IsEnum(Role, { message: 'Role must be either CUSTOMER or VENDOR' })
  @IsOptional()
  role?: Role = Role.CUSTOMER;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  businessAddress?: string;
}

export class LoginSchema {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;
}

export class VerifyEmailSchema {
  @IsString()
  @IsNotEmpty({ message: 'Verification token is required' })
  token!: string;
}

export class ResendVerificationSchema {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;
}

export class RefreshTokenSchema {
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken!: string;
}

export class ChangePasswordSchema {
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  oldPassword!: string;

  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword!: string;
}

export class ForgotPasswordSchema {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;
}

export class ResetPasswordSchema {
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required' })
  token!: string;

  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword!: string;
}

export class UpdateProfileSchema {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  businessAddress?: string;
}

export class AdminUpdateUserStatusSchema {
  @IsBoolean()
  isActive!: boolean;
}

export class AdminVerifyVendorSchema {
  @IsBoolean()
  isVerified!: boolean;
}

export class SendOtpSchema {
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^\+?[0-9]{7,15}$/, {
    message:
      'Please provide a valid phone number with country code (e.g. +9779812345678)',
  })
  phoneNumber!: string;
}

export class VerifyOtpSchema {
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^\+?[0-9]{7,15}$/, {
    message:
      'Please provide a valid phone number with country code (e.g. +9779812345678)',
  })
  phoneNumber!: string;

  @IsString()
  @IsNotEmpty({ message: 'OTP is required' })
  @Matches(/^\d{6}$/, { message: 'OTP must be a 6-digit code' })
  otp!: string;
}
