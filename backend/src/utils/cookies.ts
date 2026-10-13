import { Response, CookieOptions } from 'express';

const REFRESH_COOKIE_NAME = 'flexora_rt';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function getRefreshCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: SEVEN_DAYS_MS,
    path: '/api/v1/auth',
  };
}

export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, getRefreshCookieOptions());
}

export function clearRefreshTokenCookie(res: Response): void {
  const options = getRefreshCookieOptions();
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite,
    path: options.path,
  });
}

export { REFRESH_COOKIE_NAME };
