import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/session';
import { KIND_LABEL, SENTIMENT_LABEL, STATUS_LABEL, Kind, Sentiment, Status } from '@/lib/types';

// GET /api/export?format=csv|json : ดาวน์โหลดข้อมูลของตัวเองเป็นไฟล์
export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });

  const format = req.nextUrl.searchParams.get('format') === 'csv' ? 'csv' : 'json';
  const prefs = await prisma.preference.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });

  if (format === 'csv') {
    // ครอบข้อความด้วย "" และ escape เครื่องหมายคำพูดภายใน เพื่อไม่ให้ CSV พัง
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const header = ['ชื่อ', 'ประเภท', 'ความรู้สึก', 'ระดับ', 'เหตุผล', 'สถานะ', 'วันที่บันทึก', 'รูปภาพ'];
    const rows = prefs.map((p) =>
      [
        p.name,
        KIND_LABEL[p.kind as Kind],
        SENTIMENT_LABEL[p.sentiment as Sentiment],
        p.level,
        p.reason,
        STATUS_LABEL[p.status as Status],
        p.createdAt.toISOString().slice(0, 10),
        p.imageUrl ?? '',
      ].map(esc).join(','),
    );
    // \uFEFF (BOM) ทำให้ Excel อ่านภาษาไทยได้ถูกต้อง
    const csv = '\uFEFF' + [header.map(esc).join(','), ...rows].join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="preferences.csv"',
      },
    });
  }

  // JSON: รวมทั้งรายการความรู้สึกและไดอารี่
  const diary = await prisma.diaryEntry.findMany({ where: { userId }, orderBy: { entryDate: 'desc' } });
  return new NextResponse(JSON.stringify({ exportedAt: new Date(), preferences: prefs, diary }, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="my-data.json"',
    },
  });
}
