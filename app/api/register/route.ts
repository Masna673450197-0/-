import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registerSchema, toFieldErrors } from '@/lib/validation';

// POST /api/register : สมัครสมาชิกใหม่
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);       // ตรวจสอบข้อมูลฝั่ง Server
  if (!parsed.success) {
    return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง', fieldErrors: toFieldErrors(parsed.error) }, { status: 400 });
  }
  const { name, email, password } = parsed.data;

  // อีเมลต้องไม่ซ้ำ
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: 'อีเมลนี้ถูกใช้งานแล้ว', fieldErrors: { email: 'อีเมลนี้ถูกใช้งานแล้ว' } }, { status: 409 });
  }

  // hash รหัสผ่านก่อนเก็บ (ห้ามเก็บรหัสผ่านจริงลงฐานข้อมูล)
  const passwordHash = await bcrypt.hash(password, 10);
  // Authorization: ผู้ใช้คนแรกของระบบจะได้เป็น ADMIN อัตโนมัติ คนถัดไปเป็น USER
  const isFirstUser = (await prisma.user.count()) === 0;
  await prisma.user.create({ data: { name, email, passwordHash, role: isFirstUser ? 'ADMIN' : 'USER' } });
  return NextResponse.json({ ok: true }, { status: 201 });
}
