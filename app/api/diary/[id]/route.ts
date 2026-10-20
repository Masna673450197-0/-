import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/session';
import { diarySchema, toFieldErrors } from '@/lib/validation';
import { checkImageFields, deleteImage } from '@/lib/cloudinary';

type Ctx = { params: { id: string } };
const unauthorized = () => NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
const notFound = () => NextResponse.json({ error: 'ไม่พบไดอารี่นี้' }, { status: 404 });

// PUT /api/diary/:id : แก้ไขไดอารี่ (เฉพาะของตัวเอง)
export async function PUT(req: NextRequest, { params }: Ctx) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const existing = await prisma.diaryEntry.findFirst({ where: { id: params.id, userId } });
  if (!existing) return notFound();

  const parsed = diarySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง', fieldErrors: toFieldErrors(parsed.error) }, { status: 400 });
  }
  const { title, content, mood, entryDate, imageUrl, imagePublicId } = parsed.data;
  const imgErr = checkImageFields(userId, { imageUrl, imagePublicId });
  if (imgErr) return NextResponse.json({ error: imgErr }, { status: 400 });

  // imageUrl เป็น undefined = คงรูปเดิม, null = ลบรูป, ค่า = เปลี่ยนเป็นรูปใหม่
  const updated = await prisma.diaryEntry.update({
    where: { id: params.id },
    data: { title: title || null, content, mood, imageUrl, imagePublicId, entryDate: new Date(`${entryDate}T00:00:00.000Z`) },
  });

  // เปลี่ยน/ลบรูป -> ลบรูปเก่าบน Cloudinary
  if (imageUrl !== undefined && existing.imagePublicId && existing.imagePublicId !== imagePublicId) {
    await deleteImage(existing.imagePublicId);
  }
  return NextResponse.json(updated);
}

// DELETE /api/diary/:id : ลบไดอารี่ (เฉพาะของตัวเอง)
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const existing = await prisma.diaryEntry.findFirst({ where: { id: params.id, userId } });
  if (!existing) return notFound();

  await prisma.diaryEntry.delete({ where: { id: params.id } });
  await deleteImage(existing.imagePublicId);   // ลบรูปบน Cloudinary ด้วย
  return NextResponse.json({ ok: true });
}
