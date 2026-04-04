import { doubleCsrf } from 'csrf-csrf';
import type { Request } from 'express';

export const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => `${process.env.CSRF_SECRET}`,
  getSessionIdentifier: (req: Request) => {
    return (req.cookies?.userId as string) || '';
  },
  //   Le decimos a NestJs que busque el token en los headers
  getCsrfTokenFromRequest: (req: Request) => {
    return req.headers['x-csrf-token'];
  },
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: false,
  },
  skipCsrfProtection: (req: Request) => {
    const excludedRoutes = [
      '/api/auth/login',
      '/api/auth/register',
      // '/api/auth/check-status',
    ];
    return excludedRoutes.includes(req.path);
  },
});
