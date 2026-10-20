import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// NextAuth จัดการ /api/auth/signin, /signout, /session ฯลฯ ให้อัตโนมัติ
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
