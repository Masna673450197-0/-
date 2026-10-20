import { DefaultSession } from 'next-auth';

// ขยาย type ของ NextAuth ให้ session.user มี id และ role ด้วย
declare module 'next-auth' {
  interface Session {
    user: { id: string; role: 'USER' | 'ADMIN' } & DefaultSession['user'];
  }
  interface User {
    role?: 'USER' | 'ADMIN';
  }
}
declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: 'USER' | 'ADMIN';
  }
}
