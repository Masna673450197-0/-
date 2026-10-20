import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/session';
import { preferenceSchema, toFieldErrors } from '@/lib/validation';
import { checkImageFields } from '@/lib/cloudinary';

const unauthorized = () => NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });

// ============================================================
// GET /api/preferences  (READ + Search + Multi-Filter + Sort)
// ตัวอย่าง: /api/preferences?q=กาแฟ&kind=THING&sentiment=LIKED&sort=level_desc
// ============================================================
export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return unauthorized();            // ต้องล็อกอินก่อน

  const sp = req.nextUrl.searchParams;
  const q = sp.get('q')?.trim();                 // คำค้นหา
  const kind = sp.get('kind');                   // PERSON | THING | ALL
  const sentiment = sp.get('sentiment');         // LIKED | DISLIKED | ALL
  const status = sp.get('status');               // ACTIVE | RELEASED | ALL
  const sort = sp.get('sort') ?? 'newest';

  // สร้างเงื่อนไข where: ดึงเฉพาะข้อมูลของผู้ใช้คนนี้เสมอ (กันดูข้อมูลคนอื่น)
  const where: Prisma.PreferenceWhereInput = { userId };

  // --- Filter ตามประเภท / ความรู้สึก / สถานะ (ใส่เฉพาะเมื่อค่าถูกต้อง) ---
  if (kind === 'PERSON' || kind === 'THING') where.kind = kind;
  if (sentiment === 'LIKED' || sentiment === 'DISLIKED') where.sentiment = sentiment;
  if (status === 'ACTIVE' || status === 'RELEASED') where.status = status;

  // --- Search: ค้นหาจาก "ชื่อ" หรือ "เหตุผล" (OR) ---
  // mode: 'insensitive' = ไม่สนตัวพิมพ์เล็ก/ใหญ่ (เช่น ค้น coffee เจอ Coffee)
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { reason: { contains: q, mode: 'insensitive' } },
    ];
  }

  // --- Sort: จัดเรียงตามตัวเลือก ---
  const orderByMap: Record<string, Prisma.PreferenceOrderByWithRelationInput> = {
    newest: { createdAt: 'desc' },
    oldest: { createdAt: 'asc' },
    level_desc: { level: 'desc' },
    level_asc: { level: 'asc' },
    name: { name: 'asc' },
  };
  const orderBy = orderByMap[sort] ?? orderByMap.newest;

  // ดึงรายการ + นับสถิติภาพรวม (ไม่ขึ้นกับ filter) พร้อมกันเพื่อความเร็ว
  const [items, total, liked, disliked, released] = await Promise.all([
    prisma.preference.findMany({ where, orderBy }),
    prisma.preference.count({ where: { userId } }),
    prisma.preference.count({ where: { userId, sentiment: 'LIKED' } }),
    prisma.preference.count({ where: { userId, sentiment: 'DISLIKED' } }),
    prisma.preference.count({ where: { userId, status: 'RELEASED' } }),
  ]);

  return NextResponse.json({ items, stats: { total, liked, disliked, released } });
}

// ============================================================
// POST /api/preferences  (CREATE)
// ============================================================
export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const body = await req.json().catch(() => null);
  // Validation ฝั่ง Server: ห้ามเชื่อข้อมูลจาก Client เด็ดขาด
  const parsed = preferenceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'ข้อมูลไม่ถูกต้อง', fieldErrors: toFieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const data = parsed.data;
  // ตรวจว่ารูปที่แนบมาเป็นของผู้ใช้คนนี้จริง (กันแอบอ้างรูปคนอื่น)
  const imgErr = checkImageFields(userId, data);
  if (imgErr) return NextResponse.json({ error: imgErr }, { status: 400 });

  const created = await prisma.preference.create({
    data: {
      ...data,
      userId,                                                  // ผูกกับเจ้าของข้อมูล
      releasedAt: data.status === 'RELEASED' ? new Date() : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
