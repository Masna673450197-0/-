import { withAuth } from 'next-auth/middleware';

// Middleware: ด่านแรกป้องกันหน้าเว็บ
// - /preferences, /diary : ต้องล็อกอิน (Authentication)
// - /admin               : ต้องล็อกอินและมี role = ADMIN (Authorization)
export default withAuth({
  pages: { signIn: '/login' },
  callbacks: {
    authorized: ({ token, req }) =>
      req.nextUrl.pathname.startsWith('/admin') ? token?.role === 'ADMIN' : !!token,
  },
});

export const config = { matcher: ['/preferences/:path*', '/diary/:path*', '/admin/:path*'] };
