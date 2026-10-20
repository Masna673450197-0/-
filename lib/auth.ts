import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

// ตั้งค่า NextAuth.js: เข้าสู่ระบบด้วย อีเมล + รหัสผ่าน (Credentials)
export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },        // เก็บ session เป็น JWT ใน cookie (ไม่ต้องมีตาราง session)
  pages: { signIn: '/login' },         // ถ้ายังไม่ล็อกอินให้ไปหน้า /login ของเราเอง
  providers: [
    CredentialsProvider({
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      // authorize() = ตรวจสอบว่าอีเมล/รหัสผ่านถูกต้องไหม คืน user ถ้าผ่าน คืน null ถ้าไม่ผ่าน
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });
        if (!user) return null;
        // เทียบรหัสที่กรอกกับ hash ในฐานข้อมูล
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role as 'USER' | 'ADMIN' };
      },
    }),
  ],
  callbacks: {
    // ใส่ user.id และ role ลงใน token ตอนล็อกอิน
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? 'USER';
      }
      return token;
    },
    // ส่ง id และ role จาก token ไปให้ session เพื่อให้ฝั่งเว็บใช้ได้ (เช่น ซ่อน/แสดงเมนูแอดมิน)
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role ?? 'USER';
      }
      return session;
    },
  },
};
