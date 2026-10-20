'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

// แถบเมนูด้านบน: แสดงเมนูต่างกันตามสถานะล็อกอิน
export default function Navbar() {
  const { data: session } = useSession();
  const path = usePathname();
  const link = (href: string, label: string) => (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm transition ${
        path.startsWith(href) ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="border-b border-stone-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight text-stone-900">🌿 Mindful Tracker</Link>
        <nav className="flex items-center gap-1.5">
          {session ? (
            <>
              {link('/preferences', 'ความรู้สึก')}
              {link('/diary', 'ไดอารี่')}
              {session.user.role === 'ADMIN' && link('/admin', 'ผู้ดูแล')}
              <span className="mx-2 hidden text-xs text-stone-400 sm:inline">{session.user.name}</span>
              <button className="btn-ghost !py-1.5" onClick={() => signOut({ callbackUrl: '/login' })}>ออกจากระบบ</button>
            </>
          ) : (
            <>
              {link('/login', 'เข้าสู่ระบบ')}
              {link('/register', 'สมัครสมาชิก')}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
