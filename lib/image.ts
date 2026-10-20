// ตัวช่วยเรื่องรูปภาพฝั่ง Client (ใช้ในฟอร์ม)
export const IMAGE_MAX_MB = 2;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Validation ฝั่ง Client: ชนิดไฟล์ + ขนาด (Server ตรวจซ้ำอีกครั้งที่ /api/upload)
export function validateImageFile(f: File): string | null {
  if (!IMAGE_TYPES.includes(f.type)) return 'รองรับเฉพาะไฟล์ JPG, PNG, WEBP';
  if (f.size > IMAGE_MAX_MB * 1024 * 1024) return `ไฟล์ใหญ่เกิน ${IMAGE_MAX_MB} MB`;
  return null;
}

// ให้ Cloudinary ย่อรูป + บีบอัดให้อัตโนมัติ โหลดเร็วขึ้น
export function thumb(url: string, width = 800) {
  return url.includes('/upload/') ? url.replace('/upload/', `/upload/c_limit,w_${width},q_auto,f_auto/`) : url;
}

export async function uploadImageFile(file: File): Promise<{ url: string; publicId: string }> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? 'อัปโหลดรูปไม่สำเร็จ');
  return data;
}

// ใช้ย้อนกลับ: ถ้าอัปโหลดรูปแล้วแต่บันทึกรายการล้มเหลว ให้ลบรูปนั้นทิ้ง
export async function removeUploaded(publicId: string) {
  await fetch('/api/upload', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicId }),
  }).catch(() => {});
}
