export class CookieUtil {
  static extractRefreshToken(cookieHeader: string | undefined): string | null {
    if (!cookieHeader) {
      return null;
    }

    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) {
        acc[key] = decodeURIComponent(value);
      }
      return acc;
    }, {} as Record<string, string>);

    return cookies['refreshToken'] || null;
  }
}
