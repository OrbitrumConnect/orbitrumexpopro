import 'express-session';

declare module 'express-session' {
  interface SessionData {
    pendingUserType?: 'client' | 'professional';
    pendingUserData?: {
      email: string;
      fullName?: string;
      googleId?: string;
    };
  }
}