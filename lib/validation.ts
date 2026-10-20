import { z, ZodError } from 'zod';

// ============================================================
// Data Validation (Zod)
// ไฟล์นี้ถูกใช้ "ทั้งฝั่ง Client (ฟอร์ม) และ Server (API)"
// เขียนกฎครั้งเดียว ใช้ได้สองที่ จึงตรวจสอบตรงกันเสมอ
// ============================================================

export const preferenceSchema = z.object({
  // บังคับกรอกชื่อ (ตัดช่องว่างหัวท้ายก่อนนับความยาว)
  name: z.string().trim().min(1, 'กรุณากรอกชื่อบุคคลหรือสิ่งของ').max(100, 'ชื่อยาวเกิน 100 ตัวอักษร'),
  // ประเภทต้องเป็นค่าที่กำหนดเท่านั้น
  kind: z.enum(['PERSON', 'THING'], { errorMap: () => ({ message: 'ประเภทไม่ถูกต้อง' }) }),
  sentiment: z.enum(['LIKED', 'DISLIKED'], { errorMap: () => ({ message: 'ความรู้สึกไม่ถูกต้อง' }) }),
  // ระดับความรู้สึกต้องเป็นจำนวนเต็ม 1-5 เท่านั้น
  level: z
    .number({ invalid_type_error: 'ระดับต้องเป็นตัวเลข' })
    .int('ระดับต้องเป็นจำนวนเต็ม')
    .min(1, 'ระดับต่ำสุดคือ 1')
    .max(5, 'ระดับสูงสุดคือ 5'),
  // บังคับระบุเหตุผลอย่างน้อย 5 ตัวอักษร
  reason: z.string().trim().min(5, 'กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษร').max(2000, 'เหตุผลยาวเกิน 2000 ตัวอักษร'),
  status: z.enum(['ACTIVE', 'RELEASED']).default('ACTIVE'),
  // รูปภาพ (ไม่บังคับ): ไม่ส่งมา = คงรูปเดิม, ส่ง null = ลบรูป, ส่งค่า = ใช้รูปใหม่
  imageUrl: z.string().url().max(500).nullable().optional(),
  imagePublicId: z.string().max(300).nullable().optional(),
});
export type PreferenceInput = z.infer<typeof preferenceSchema>;

export const diarySchema = z.object({
  title: z.string().trim().max(100, 'หัวข้อยาวเกิน 100 ตัวอักษร').optional().or(z.literal('')),
  content: z.string().trim().min(3, 'กรุณาเขียนเนื้อหาอย่างน้อย 3 ตัวอักษร').max(10000, 'เนื้อหายาวเกินไป'),
  mood: z.number().int().min(1, 'อารมณ์ต้องอยู่ระหว่าง 1-5').max(5, 'อารมณ์ต้องอยู่ระหว่าง 1-5'),
  // วันที่รูปแบบ YYYY-MM-DD
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'รูปแบบวันที่ไม่ถูกต้อง'),
  imageUrl: z.string().url().max(500).nullable().optional(),
  imagePublicId: z.string().max(300).nullable().optional(),
});
export type DiaryInput = z.infer<typeof diarySchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'กรุณากรอกชื่อ').max(60),
  email: z.string().trim().toLowerCase().email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร').max(100),
});

// แปลง error ของ Zod เป็น { ชื่อช่อง: ข้อความ } เพื่อแสดงใต้ช่องกรอกแต่ละช่อง
export function toFieldErrors(err: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!out[key]) out[key] = issue.message; // เก็บเฉพาะ error แรกของแต่ละช่อง
  }
  return out;
}

// ใช้ตรวจ body ตอนแอดมินเปลี่ยนบทบาทผู้ใช้ (รับได้เฉพาะ USER หรือ ADMIN)
export const roleSchema = z.object({
  role: z.enum(['USER', 'ADMIN'], { errorMap: () => ({ message: 'บทบาทไม่ถูกต้อง' }) }),
});
