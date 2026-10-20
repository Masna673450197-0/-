import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { prisma } from './prisma';

// ใช้ใน API Route: คืน id ของผู้ใช้ที่ล็อกอินอยู่ (ถ้าไม่ได้ล็อกอินคืน null)
export async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

// ============================================================
// Authorization: ตรวจว่าผู้เรียก API เป็น ADMIN จริงหรือไม่
// - 401 = ยังไม่ล็อกอิน (Authentication ไม่ผ่าน)
// - 403 = ล็อกอินแล้วแต่ไม่มีสิทธิ์ (Authorization ไม่ผ่าน)
// เช็ค role จาก "ฐานข้อมูล" ทุกครั้ง ไม่เชื่อ role ใน token เพราะอาจเก่า
// ============================================================
export async function checkAdmin(): Promise<{ userId: string } | { status: 401 | 403 }> {
  const userId = await getUserId();
  if (!userId) return { status: 401 };
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return u?.role === 'ADMIN' ? { userId } : { status: 403 };
}
