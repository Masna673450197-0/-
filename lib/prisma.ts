import { PrismaClient } from '@prisma/client';

// สร้าง PrismaClient ตัวเดียวแล้วใช้ซ้ำ
// (ตอน dev โค้ดถูก reload บ่อย ถ้าไม่ทำแบบนี้จะเปิด connection ซ้ำจนเต็ม)
const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') g.prisma = prisma;
