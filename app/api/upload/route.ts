import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/session';
import { cloudinaryReady, deleteImage, imageFolder, uploadImage } from '@/lib/cloudinary';

const MAX_BYTES = 2 * 1024 * 1024;                                  // 2 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

// POST /api/upload : อัปโหลดรูป (multipart/form-data, ฟิลด์ชื่อ "file")
export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  if (!cloudinaryReady()) {
    return NextResponse.json({ error: 'ยังไม่ได้ตั้งค่า Cloudinary (CLOUDINARY_* ใน .env)' }, { status: 503 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'ไม่พบไฟล์รูปภาพ' }, { status: 400 });

  // Validation ฝั่ง Server: ห้ามเชื่อการตรวจของ Client
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: 'รองรับเฉพาะไฟล์ JPG, PNG, WEBP' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'ไฟล์ใหญ่เกิน 2 MB' }, { status: 400 });

  try {
    return NextResponse.json(await uploadImage(file, userId), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'อัปโหลดไม่สำเร็จ' }, { status: 502 });
  }
}

// DELETE /api/upload : ลบรูปที่เพิ่งอัปโหลดแต่ยังไม่ได้ใช้ (เช่น บันทึกรายการไม่สำเร็จ)
// อนุญาตเฉพาะรูปในโฟลเดอร์ของผู้ใช้คนนั้น
export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });

  const { publicId } = await req.json().catch(() => ({}));
  if (typeof publicId !== 'string' || !publicId.startsWith(`${imageFolder(userId)}/`)) {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์ลบรูปนี้' }, { status: 403 });
  }
  await deleteImage(publicId);
  return NextResponse.json({ ok: true });
}
