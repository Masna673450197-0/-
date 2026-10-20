'use client';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Role, ROLE_LABEL } from '@/lib/types';

interface AdminUser {
  id: string; name: string; email: string; role: Role; createdAt: string;
  _count: { preferences: number; diaries: number };
}
interface Stats { users: number; admins: number; preferences: number; diaries: number }

// หน้าผู้ดูแลระบบ (เฉพาะ ADMIN): ดูสถิติรวม จัดการบทบาท และลบผู้ใช้
export default function AdminPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/users');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setError(data.error ?? 'โหลดข้อมูลไม่สำเร็จ');   // เช่น 403 ไม่มีสิทธิ์
    else { setUsers(data.users); setStats(data.stats); setError(''); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  // UPDATE: สลับบทบาท USER <-> ADMIN
  async function toggleRole(u: AdminUser) {
    const role: Role = u.role === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!confirm(`เปลี่ยน ${u.name} เป็น "${ROLE_LABEL[role]}" ใช่หรือไม่?`)) return;
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }),
    });
    if (!res.ok) alert((await res.json()).error ?? 'ไม่สำเร็จ');
    load();
  }

  // DELETE: ลบผู้ใช้ (ข้อมูลทั้งหมดของเขาหายด้วย)
  async function remove(u: AdminUser) {
    if (!confirm(`ลบผู้ใช้ "${u.name}" และข้อมูลทั้งหมดของเขา? การกระทำนี้ย้อนกลับไม่ได้`)) return;
    const res = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' });
    if (!res.ok) alert((await res.json()).error ?? 'ไม่สำเร็จ');
    load();
  }

  if (loading) return <p className="py-10 text-center text-sm text-stone-400">กำลังโหลด...</p>;
  if (error) return <div className="card py-12 text-center text-rose-500">🔒 {error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">ผู้ดูแลระบบ</h1>
        <p className="text-sm text-stone-500">จัดการผู้ใช้และดูสถิติรวม (ไม่แสดงเนื้อหาส่วนตัวของผู้ใช้)</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'ผู้ใช้ทั้งหมด', value: stats.users },
            { label: 'ผู้ดูแล', value: stats.admins },
            { label: 'รายการความรู้สึก', value: stats.preferences },
            { label: 'ไดอารี่', value: stats.diaries },
          ].map((s) => (
            <div key={s.label} className="card !p-4">
              <p className="text-xs text-stone-500">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card overflow-x-auto !p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs text-stone-500">
            <tr><th className="p-3">ชื่อ</th><th className="p-3">อีเมล</th><th className="p-3">บทบาท</th><th className="p-3">ความรู้สึก</th><th className="p-3">ไดอารี่</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isMe = u.id === session?.user.id;   // ห้ามจัดการบัญชีตัวเอง
              return (
                <tr key={u.id} className="border-b border-stone-100 last:border-0">
                  <td className="p-3 font-medium">{u.name} {isMe && <span className="text-xs text-stone-400">(คุณ)</span>}</td>
                  <td className="p-3 text-stone-500">{u.email}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs ${u.role === 'ADMIN' ? 'bg-amber-50 text-amber-700' : 'bg-stone-100 text-stone-600'}`}>{ROLE_LABEL[u.role]}</span>
                  </td>
                  <td className="p-3">{u._count.preferences}</td>
                  <td className="p-3">{u._count.diaries}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button className="btn-ghost !px-3 !py-1 text-xs" disabled={isMe} onClick={() => toggleRole(u)}>{u.role === 'ADMIN' ? 'ลดเป็นผู้ใช้' : 'ตั้งเป็นแอดมิน'}</button>
                      <button className="btn-danger !px-3 !py-1 text-xs" disabled={isMe} onClick={() => remove(u)}>ลบ</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
