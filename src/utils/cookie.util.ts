import { CookieOptions, Response } from 'express';
import { DotenvConfig, Environment } from '../config/env.config';

export class CookieUtil {
  private static getBaseCookieOptions(): CookieOptions {
    const isProd = DotenvConfig.NODE_ENV === Environment.PRODUCTION;
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
    };
  }

  static setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    const baseOptions = this.getBaseCookieOptions();

    // Access token cookie
    res.cookie('accessToken', accessToken, {
      ...baseOptions,
      maxAge: DotenvConfig.JWT_ACCESS_EXPIRES_SECONDS * 1000,
    });

    // Refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      ...baseOptions,
      maxAge: DotenvConfig.JWT_REFRESH_EXPIRES_SECONDS * 1000,
    });
  }

  static clearAuthCookies(res: Response): void {
    const baseOptions = this.getBaseCookieOptions();
    res.clearCookie('accessToken', baseOptions);
    res.clearCookie('refreshToken', baseOptions);
  }
}
