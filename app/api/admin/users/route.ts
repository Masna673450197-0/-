import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/session';

// GET /api/admin/users : รายชื่อผู้ใช้ทั้งหมด + สถิติรวม (เฉพาะ ADMIN)
// หมายเหตุด้านความเป็นส่วนตัว: แอดมินเห็นเพียง "จำนวน" รายการ ไม่เห็นเนื้อหาความรู้สึก/ไดอารี่ของใคร
export async function GET() {
  const auth = await checkAdmin();
  if ('status' in auth) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'กรุณาเข้าสู่ระบบ' : 'ไม่มีสิทธิ์เข้าถึง (เฉพาะผู้ดูแลระบบ)' },
      { status: auth.status },
    );
  }

  const [users, preferences, diaries] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      // select เฉพาะฟิลด์ที่จำเป็น — ไม่ส่ง passwordHash ออกไปเด็ดขาด
      select: {
        id: true, name: true, email: true, role: true, createdAt: true,
        _count: { select: { preferences: true, diaries: true } },
      },
    }),
    prisma.preference.count(),
    prisma.diaryEntry.count(),
  ]);

  return NextResponse.json({
    users,
    stats: { users: users.length, admins: users.filter((u) => u.role === 'ADMIN').length, preferences, diaries },
  });
}
