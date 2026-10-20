'use client';
import { useCallback, useEffect, useState } from 'react';
import PreferenceCard from '@/components/PreferenceCard';
import PreferenceForm from '@/components/PreferenceForm';
import { Preference } from '@/lib/types';

interface Stats { total: number; liked: number; disliked: number; released: number }

// ตัวช่วยสร้างปุ่ม Filter แบบ "chip" ที่กดเลือกได้
function Chips<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: { v: T; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)}
          className={`rounded-full border px-3 py-1 text-xs transition ${value === o.v ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-100'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function PreferencesPage() {
  // ---------- State ----------
  const [items, setItems] = useState<Preference[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, liked: 0, disliked: 0, released: 0 });
  const [loading, setLoading] = useState(true);

  // ค่าของ Search / Filter / Sort
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [kind, setKind] = useState<'ALL' | 'PERSON' | 'THING'>('ALL');
  const [sentiment, setSentiment] = useState<'ALL' | 'LIKED' | 'DISLIKED'>('ALL');
  const [status, setStatus] = useState<'ALL' | 'ACTIVE' | 'RELEASED'>('ALL');
  const [sort, setSort] = useState('newest');

  // ควบคุม Modal ฟอร์ม: undefined = ปิด, null = เพิ่มใหม่, Preference = แก้ไข
  const [editing, setEditing] = useState<Preference | null | undefined>(undefined);

  // Debounce: รอผู้ใช้หยุดพิมพ์ 300ms ก่อนค่อยค้นหา เพื่อไม่ให้ยิง API ทุกตัวอักษร
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  // ---------- READ: โหลดรายการจาก API ตามเงื่อนไข Search/Filter/Sort ----------
  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ sort });
    if (debouncedQ) params.set('q', debouncedQ);
    if (kind !== 'ALL') params.set('kind', kind);
    if (sentiment !== 'ALL') params.set('sentiment', sentiment);
    if (status !== 'ALL') params.set('status', status);

    const res = await fetch(`/api/preferences?${params}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
      setStats(data.stats);
    }
    setLoading(false);
  }, [debouncedQ, kind, sentiment, status, sort]);

  // โหลดใหม่ทุกครั้งที่เงื่อนไขเปลี่ยน
  useEffect(() => { load(); }, [load]);

  // ---------- DELETE ----------
  async function handleDelete(p: Preference) {
    if (!confirm(`ลบ "${p.name}" ใช่หรือไม่?`)) return;   // ยืนยันก่อนลบ
    await fetch(`/api/preferences/${p.id}`, { method: 'DELETE' });
    load();
  }

  // ---------- UPDATE (ทางลัด): สลับสถานะ ACTIVE <-> RELEASED ----------
  async function handleToggleRelease(p: Preference) {
    await fetch(`/api/preferences/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: p.name, kind: p.kind, sentiment: p.sentiment, level: p.level, reason: p.reason,
        status: p.status === 'RELEASED' ? 'ACTIVE' : 'RELEASED',
      }),
    });
    load();
  }

  const hasFilter = q || kind !== 'ALL' || sentiment !== 'ALL' || status !== 'ALL';
  const clear = () => { setQ(''); setKind('ALL'); setSentiment('ALL'); setStatus('ALL'); };

  return (
    <div className="space-y-6">
      {/* ---------- ส่วนหัว + ปุ่มเพิ่ม + Export ---------- */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">บันทึกความรู้สึก</h1>
          <p className="text-sm text-stone-500">สิ่งที่ประทับใจ สิ่งที่ไม่พึงพอใจ และสิ่งที่ปล่อยวางแล้ว</p>
        </div>
        <div className="flex gap-2">
          <a className="btn-ghost" href="/api/export?format=csv">⬇ CSV</a>
          <a className="btn-ghost" href="/api/export?format=json">⬇ JSON</a>
          <button className="btn-primary" onClick={() => setEditing(null)}>＋ เพิ่มรายการ</button>
        </div>
      </div>

      {/* ---------- สถิติสรุปภาพรวม ---------- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'ทั้งหมด', value: stats.total, tone: 'text-stone-900' },
          { label: '💚 ประทับใจ', value: stats.liked, tone: 'text-emerald-600' },
          { label: '💔 ไม่พึงพอใจ', value: stats.disliked, tone: 'text-rose-600' },
          { label: '🕊️ ปล่อยวางแล้ว', value: stats.released, tone: 'text-sky-600' },
        ].map((s) => (
          <div key={s.label} className="card !p-4">
            <p className="text-xs text-stone-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-semibold ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ---------- Search & Multi-Filter ---------- */}
      <div className="card space-y-4">
        <input className="input" placeholder="🔍 ค้นหาจากชื่อ หรือ เหตุผล..." value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="label">ประเภท</p>
            <Chips value={kind} onChange={setKind} options={[{ v: 'ALL', label: 'ทั้งหมด' }, { v: 'PERSON', label: 'บุคคล' }, { v: 'THING', label: 'สิ่งของ' }]} />
          </div>
          <div>
            <p className="label">ความรู้สึก</p>
            <Chips value={sentiment} onChange={setSentiment} options={[{ v: 'ALL', label: 'ทั้งหมด' }, { v: 'LIKED', label: 'ชอบ' }, { v: 'DISLIKED', label: 'ไม่ชอบ' }]} />
          </div>
          <div>
            <p className="label">สถานะ</p>
            <Chips value={status} onChange={setStatus} options={[{ v: 'ALL', label: 'ทั้งหมด' }, { v: 'ACTIVE', label: 'บันทึกไว้' }, { v: 'RELEASED', label: 'ปล่อยวาง' }]} />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <select className="input !w-auto" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">ใหม่สุดก่อน</option>
            <option value="oldest">เก่าสุดก่อน</option>
            <option value="level_desc">ระดับสูง → ต่ำ</option>
            <option value="level_asc">ระดับต่ำ → สูง</option>
            <option value="name">ชื่อ ก-ฮ</option>
          </select>
          <div className="flex items-center gap-3 text-xs text-stone-500">
            พบ {items.length} รายการ
            {hasFilter && <button className="underline" onClick={clear}>ล้างตัวกรอง</button>}
          </div>
        </div>
      </div>

      {/* ---------- รายการการ์ด ---------- */}
      {loading ? (
        <p className="py-10 text-center text-sm text-stone-400">กำลังโหลด...</p>
      ) : items.length === 0 ? (
        <div className="card py-12 text-center text-stone-400">
          {hasFilter ? 'ไม่พบรายการที่ตรงกับเงื่อนไข' : 'ยังไม่มีรายการ ลองกด "เพิ่มรายการ" ดูสิ'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((p) => (
            <PreferenceCard key={p.id} item={p} onEdit={setEditing} onDelete={handleDelete} onToggleRelease={handleToggleRelease} />
          ))}
        </div>
      )}

      {/* ---------- Modal ฟอร์ม เพิ่ม/แก้ไข ---------- */}
      {editing !== undefined && (
        <PreferenceForm initial={editing} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); load(); }} />
      )}
    </div>
  );
}
