import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// หน้าแรก: แนะนำระบบ และพาไปหน้าที่เหมาะกับสถานะล็อกอิน
export default async function Home() {
  const session = await getServerSession(authOptions);
  return (
    <section className="mx-auto mt-16 max-w-xl text-center">
      <p className="text-5xl">🌿</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">บันทึกความรู้สึก ปล่อยวางอย่างมีสติ</h1>
      <p className="mt-3 leading-relaxed text-stone-500">
        จดความประทับใจและความไม่พึงพอใจต่อผู้คน สิ่งของ สถานที่ และบริการ พร้อมไดอารี่ประจำวัน
        และเมื่อพร้อมแล้วก็กด &ldquo;ปล่อยวาง&rdquo;
      </p>
      <div className="mt-8 flex justify-center gap-3">
        {session ? (
          <>
            <Link className="btn-primary" href="/preferences">ไปที่ความรู้สึก</Link>
            <Link className="btn-ghost" href="/diary">เปิดไดอารี่</Link>
          </>
        ) : (
          <>
            <Link className="btn-primary" href="/register">เริ่มต้นใช้งาน</Link>
            <Link className="btn-ghost" href="/login">เข้าสู่ระบบ</Link>
          </>
        )}
      </div>
    </section>
  );
}
