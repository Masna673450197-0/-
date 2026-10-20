'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

// ฟอร์มเดียวใช้ได้ทั้งหน้า Login และ Register
export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register';
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // สมัครสมาชิก: เรียก API ก่อน ถ้าสำเร็จค่อยล็อกอินต่อ
    if (isRegister) {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const first = data.fieldErrors ? (Object.values(data.fieldErrors)[0] as string) : data.error;
        setLoading(false);
        return setError(first ?? 'สมัครสมาชิกไม่สำเร็จ');
      }
    }

    // เข้าสู่ระบบด้วย NextAuth (redirect: false เพื่อจัดการเองในหน้านี้)
    const result = await signIn('credentials', { email: form.email, password: form.password, redirect: false });
    setLoading(false);
    if (result?.error) return setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    router.push('/preferences');
    router.refresh();
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <form onSubmit={submit} className="card mx-auto mt-16 max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">{isRegister ? 'สร้างบัญชีใหม่' : 'ยินดีต้อนรับกลับมา'}</h1>
      {isRegister && (
        <div><label className="label">ชื่อ</label><input className="input" value={form.name} onChange={set('name')} required /></div>
      )}
      <div><label className="label">อีเมล</label><input className="input" type="email" value={form.email} onChange={set('email')} required /></div>
      <div><label className="label">รหัสผ่าน</label><input className="input" type="password" value={form.password} onChange={set('password')} required /></div>
      {error && <p className="err">{error}</p>}
      <button className="btn-primary w-full" disabled={loading}>{loading ? 'กำลังดำเนินการ...' : isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}</button>
      <p className="text-center text-xs text-stone-500">
        {isRegister ? 'มีบัญชีแล้ว? ' : 'ยังไม่มีบัญชี? '}
        <Link className="underline" href={isRegister ? '/login' : '/register'}>{isRegister ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</Link>
      </p>
    </form>
  );
}
