import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AdminAuthSchema {
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Please enter your password' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;
}

export class AdminRefreshTokenSchema {
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken!: string;
}

export class AdminChangePasswordSchema {
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  oldPassword!: string;

  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword!: string;
}

export class AdminForgotPasswordSchema {
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email!: string;
}

export class AdminResetPasswordSchema {
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required' })
  token!: string;

  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword!: string;
}
