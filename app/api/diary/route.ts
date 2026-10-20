import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/session';
import { diarySchema, toFieldErrors } from '@/lib/validation';
import { checkImageFields } from '@/lib/cloudinary';

const unauthorized = () => NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });

// GET /api/diary?q=คำค้น  : ดึงไดอารี่ของผู้ใช้ เรียงวันที่ล่าสุดก่อน
export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const q = req.nextUrl.searchParams.get('q')?.trim();
  const where: Prisma.DiaryEntryWhereInput = { userId };
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },     // ไม่สนตัวพิมพ์เล็ก/ใหญ่
      { content: { contains: q, mode: 'insensitive' } },
    ];
  }

  const items = await prisma.diaryEntry.findMany({
    where,
    orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json({ items });
}

// POST /api/diary : เพิ่มไดอารี่ใหม่
export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const parsed = diarySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง', fieldErrors: toFieldErrors(parsed.error) }, { status: 400 });
  }
  const { title, content, mood, entryDate, imageUrl, imagePublicId } = parsed.data;
  const imgErr = checkImageFields(userId, { imageUrl, imagePublicId });   // รูปต้องเป็นของผู้ใช้คนนี้
  if (imgErr) return NextResponse.json({ error: imgErr }, { status: 400 });

  const created = await prisma.diaryEntry.create({
    data: {
      userId,
      title: title || null,
      content,
      mood,
      imageUrl,
      imagePublicId,
      entryDate: new Date(`${entryDate}T00:00:00.000Z`), // แปลง YYYY-MM-DD เป็น Date
    },
  });
  return NextResponse.json(created, { status: 201 });
}
