'use client';
import { SessionProvider } from 'next-auth/react';

// ห่อทั้งแอปด้วย SessionProvider เพื่อให้ทุกคอมโพเนนต์เรียก useSession() ได้
export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
