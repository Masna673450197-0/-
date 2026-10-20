import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/session';
import { roleSchema, toFieldErrors } from '@/lib/validation';
import { deleteImage } from '@/lib/cloudinary';

type Ctx = { params: { id: string } };

const deny = (status: 401 | 403) =>
  NextResponse.json(
    { error: status === 401 ? 'กรุณาเข้าสู่ระบบ' : 'ไม่มีสิทธิ์เข้าถึง (เฉพาะผู้ดูแลระบบ)' },
    { status },
  );

// PUT /api/admin/users/:id : เปลี่ยนบทบาทผู้ใช้ (USER <-> ADMIN)
export async function PUT(req: NextRequest, { params }: Ctx) {
  const auth = await checkAdmin();
  if ('status' in auth) return deny(auth.status);

  // กันแอดมินลดสิทธิ์ตัวเองจนไม่มีใครดูแลระบบได้
  if (params.id === auth.userId) {
    return NextResponse.json({ error: 'ไม่สามารถเปลี่ยนบทบาทของตัวเองได้' }, { status: 400 });
  }

  const parsed = roleSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง', fieldErrors: toFieldErrors(parsed.error) }, { status: 400 });
  }
  if (!(await prisma.user.findUnique({ where: { id: params.id } }))) {
    return NextResponse.json({ error: 'ไม่พบผู้ใช้นี้' }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: { role: parsed.data.role },
    select: { id: true, name: true, email: true, role: true },
  });
  return NextResponse.json(updated);
}

// DELETE /api/admin/users/:id : ลบผู้ใช้ (ข้อมูลของผู้ใช้ถูกลบตามด้วย Cascade ตามที่ตั้งใน schema)
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const auth = await checkAdmin();
  if ('status' in auth) return deny(auth.status);

  if (params.id === auth.userId) {
    return NextResponse.json({ error: 'ไม่สามารถลบบัญชีของตัวเองได้' }, { status: 400 });
  }
  if (!(await prisma.user.findUnique({ where: { id: params.id } }))) {
    return NextResponse.json({ error: 'ไม่พบผู้ใช้นี้' }, { status: 404 });
  }

  // เก็บรายการรูปของผู้ใช้ไว้ก่อน เพราะลบผู้ใช้แล้วข้อมูลในตารางจะหายหมด
  const [prefImgs, diaryImgs] = await Promise.all([
    prisma.preference.findMany({ where: { userId: params.id, imagePublicId: { not: null } }, select: { imagePublicId: true } }),
    prisma.diaryEntry.findMany({ where: { userId: params.id, imagePublicId: { not: null } }, select: { imagePublicId: true } }),
  ]);

  await prisma.user.delete({ where: { id: params.id } });
  await Promise.all([...prefImgs, ...diaryImgs].map((r) => deleteImage(r.imagePublicId)));
  return NextResponse.json({ ok: true });
}
