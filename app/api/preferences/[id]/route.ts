import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/session';
import { preferenceSchema, toFieldErrors } from '@/lib/validation';
import { checkImageFields, deleteImage } from '@/lib/cloudinary';

type Ctx = { params: { id: string } };
const unauthorized = () => NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
const notFound = () => NextResponse.json({ error: 'ไม่พบรายการนี้' }, { status: 404 });

// ค้นหารายการ "ที่เป็นของผู้ใช้คนนี้เท่านั้น" (ป้องกันแก้/ลบข้อมูลของคนอื่น)
const findOwned = (id: string, userId: string) => prisma.preference.findFirst({ where: { id, userId } });

// GET /api/preferences/:id  (READ ทีละรายการ)
export async function GET(_req: NextRequest, { params }: Ctx) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const item = await findOwned(params.id, userId);
  return item ? NextResponse.json(item) : notFound();
}

// PUT /api/preferences/:id  (UPDATE)
export async function PUT(req: NextRequest, { params }: Ctx) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const existing = await findOwned(params.id, userId);
  if (!existing) return notFound();

  const body = await req.json().catch(() => null);
  const parsed = preferenceSchema.safeParse(body);       // ตรวจสอบข้อมูลใหม่อีกรอบ
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'ข้อมูลไม่ถูกต้อง', fieldErrors: toFieldErrors(parsed.error) },
      { status: 400 },
    );
  }
  const data = parsed.data;
  const imgErr = checkImageFields(userId, data);
  if (imgErr) return NextResponse.json({ error: imgErr }, { status: 400 });

  // จัดการวันที่ปล่อยวาง: เปลี่ยนเป็น RELEASED -> บันทึกเวลา / กลับเป็น ACTIVE -> ล้างค่า
  let releasedAt = existing.releasedAt;
  if (data.status === 'RELEASED' && existing.status !== 'RELEASED') releasedAt = new Date();
  if (data.status === 'ACTIVE') releasedAt = null;

  // imageUrl เป็น undefined = Prisma ไม่แตะคอลัมน์รูป (คงรูปเดิม), null = ล้างรูป
  const updated = await prisma.preference.update({ where: { id: params.id }, data: { ...data, releasedAt } });

  // ถ้าเปลี่ยน/ลบรูป ให้ลบรูปเก่าบน Cloudinary ทิ้ง ไม่ให้ค้างเปลืองพื้นที่
  if (data.imageUrl !== undefined && existing.imagePublicId && existing.imagePublicId !== data.imagePublicId) {
    await deleteImage(existing.imagePublicId);
  }
  return NextResponse.json(updated);
}

// DELETE /api/preferences/:id  (DELETE)
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const existing = await findOwned(params.id, userId);
  if (!existing) return notFound();

  await prisma.preference.delete({ where: { id: params.id } });
  await deleteImage(existing.imagePublicId);   // ลบรูปบน Cloudinary ด้วย
  return NextResponse.json({ ok: true });
}
