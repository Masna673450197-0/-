import crypto from 'crypto';

// ============================================================
// ตัวช่วยอัปโหลด/ลบรูปบน Cloudinary (ฝั่ง Server เท่านั้น)
// เรียก REST API ตรง ๆ จึงไม่ต้องติดตั้งแพ็กเกจเพิ่ม
// ใช้ "signed request": เซ็นด้วย API Secret ที่อยู่ฝั่ง Server เท่านั้น ไม่หลุดไปถึงเบราว์เซอร์
// ============================================================
const cloud = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export const cloudinaryReady = () => !!(cloud && apiKey && apiSecret);

// สร้างลายเซ็น: เรียงพารามิเตอร์ตามตัวอักษร ต่อเป็น k=v&k=v แล้วต่อด้วย secret จากนั้น SHA-1
function sign(params: Record<string, string | number>) {
  const str = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&');
  return crypto.createHash('sha1').update(str + apiSecret).digest('hex');
}

// แต่ละผู้ใช้มีโฟลเดอร์ของตัวเอง ใช้ตรวจความเป็นเจ้าของรูปด้วย
export const imageFolder = (userId: string) => `review-tracker/${userId}`;

// อัปโหลดรูป -> คืน URL และ publicId
export async function uploadImage(file: File, userId: string): Promise<{ url: string; publicId: string }> {
  const folder = imageFolder(userId);
  const timestamp = Math.floor(Date.now() / 1000);
  const fd = new FormData();
  fd.append('file', file);
  fd.append('api_key', apiKey!);
  fd.append('timestamp', String(timestamp));
  fd.append('folder', folder);
  fd.append('signature', sign({ folder, timestamp }));

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: 'POST', body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message ?? 'อัปโหลดรูปไม่สำเร็จ');
  return { url: data.secure_url as string, publicId: data.public_id as string };
}

// ลบรูปบน Cloudinary (best effort: ถ้าลบไม่สำเร็จจะไม่ทำให้การทำงานหลักล้มเหลว)
export async function deleteImage(publicId?: string | null) {
  if (!publicId || !cloudinaryReady()) return;
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const body = new URLSearchParams({
      public_id: publicId,
      api_key: apiKey!,
      timestamp: String(timestamp),
      signature: sign({ public_id: publicId, timestamp }),
    });
    await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/destroy`, { method: 'POST', body });
  } catch (e) {
    console.error('deleteImage failed', e);
  }
}

// ตรวจข้อมูลรูปที่ client ส่งมา: ต้องเป็นรูปในโฟลเดอร์ของผู้ใช้คนนี้บน Cloudinary ของเราเท่านั้น
// ป้องกันการส่ง publicId ของคนอื่นมาเพื่อให้ระบบไปลบรูปของเขา
export function checkImageFields(
  userId: string,
  d: { imageUrl?: string | null; imagePublicId?: string | null },
): string | null {
  if (d.imageUrl == null && d.imagePublicId == null) return null;   // ไม่แนบ หรือขอลบรูป
  if (!d.imageUrl || !d.imagePublicId) return 'ข้อมูลรูปภาพไม่ครบ';
  const ownFolder = d.imagePublicId.startsWith(`${imageFolder(userId)}/`);
  const ourCloud = d.imageUrl.startsWith(`https://res.cloudinary.com/${cloud}/`);
  return ownFolder && ourCloud ? null : 'รูปภาพไม่ถูกต้อง';
}
