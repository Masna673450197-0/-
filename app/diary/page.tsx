'use client';
import { useCallback, useEffect, useState } from 'react';
import { DiaryEntry, MOOD_EMOJI } from '@/lib/types';
import { diarySchema, toFieldErrors } from '@/lib/validation';
import { removeUploaded, thumb, uploadImageFile } from '@/lib/image';
import ImagePicker from '@/components/ImagePicker';

// วันที่ปัจจุบันตามเวลาท้องถิ่น (รูปแบบ YYYY-MM-DD) ใช้เป็นค่าเริ่มต้นของฟอร์ม
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const emptyForm = () => ({ title: '', content: '', mood: 3, entryDate: today() });

export default function DiaryPage() {
  const [items, setItems] = useState<DiaryEntry[]>([]);
  const [form, setForm] = useState(emptyForm());
  const [editing, setEditing] = useState<DiaryEntry | null>(null);   // เก็บทั้งรายการที่กำลังแก้ (ใช้เช็ครูปเดิม)
  const [imageUrl, setImageUrl] = useState<string | null>(null);      // รูปเดิม (null เมื่อกดลบ)
  const [file, setFile] = useState<File | null>(null);                // ไฟล์ใหม่ที่เลือก
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  // READ: โหลดไดอารี่ (รองรับค้นหา)
  const load = useCallback(async () => {
    const res = await fetch(`/api/diary${debouncedQ ? `?q=${encodeURIComponent(debouncedQ)}` : ''}`);
    if (res.ok) setItems((await res.json()).items);
    setLoading(false);
  }, [debouncedQ]);
  useEffect(() => { load(); }, [load]);

  // CREATE / UPDATE
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = diarySchema.safeParse(form);              // Validation ฝั่ง Client
    if (!parsed.success) return setErrors(toFieldErrors(parsed.error));
    setErrors({});
    setSaving(true);

    // จัดการรูป: ไฟล์ใหม่ -> อัปโหลด / กดลบรูปเดิม -> ส่ง null / ไม่ยุ่ง -> ไม่ส่งฟิลด์รูป (คงรูปเดิม)
    let imageFields: { imageUrl?: string | null; imagePublicId?: string | null } = {};
    let uploadedId: string | null = null;
    try {
      if (file) {
        const up = await uploadImageFile(file);
        uploadedId = up.publicId;
        imageFields = { imageUrl: up.url, imagePublicId: up.publicId };
      } else if (editing?.imageUrl && imageUrl === null) {
        imageFields = { imageUrl: null, imagePublicId: null };
      }
    } catch (err) {
      setSaving(false);
      return setErrors({ image: err instanceof Error ? err.message : 'อัปโหลดรูปไม่สำเร็จ' });
    }

    const res = await fetch(editing ? `/api/diary/${editing.id}` : '/api/diary', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...parsed.data, ...imageFields }),
    });
    setSaving(false);
    if (!res.ok) {
      if (uploadedId) await removeUploaded(uploadedId);      // บันทึกไม่สำเร็จ -> ลบรูปที่เพิ่งอัปโหลด
      const data = await res.json().catch(() => ({}));
      return setErrors(data.fieldErrors ?? { form: data.error ?? 'บันทึกไม่สำเร็จ' });
    }
    cancel();
    load();
  }

  function edit(d: DiaryEntry) {
    setEditing(d);
    setForm({ title: d.title ?? '', content: d.content, mood: d.mood, entryDate: d.entryDate.slice(0, 10) });
    setImageUrl(d.imageUrl);
    setFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function cancel() { setEditing(null); setForm(emptyForm()); setImageUrl(null); setFile(null); setErrors({}); }

  // DELETE (ลบรูปบน Cloudinary ให้อัตโนมัติที่ฝั่ง Server)
  async function remove(d: DiaryEntry) {
    if (!confirm('ลบไดอารี่หน้านี้ใช่หรือไม่?')) return;
    await fetch(`/api/diary/${d.id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">ไดอารี่ประจำวัน</h1>
        <p className="text-sm text-stone-500">บันทึกเรื่องราวและอารมณ์ของแต่ละวัน</p>
      </div>

      {/* ---------- ฟอร์มเขียนไดอารี่ ---------- */}
      <form onSubmit={submit} className="card space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">วันที่</label>
            <input type="date" className="input" value={form.entryDate} onChange={(e) => setForm({ ...form, entryDate: e.target.value })} />
            {errors.entryDate && <p className="err">{errors.entryDate}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="label">หัวข้อ (ไม่บังคับ)</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="วันนี้เป็นอย่างไรบ้าง" />
            {errors.title && <p className="err">{errors.title}</p>}
          </div>
        </div>
        <div>
          <label className="label">อารมณ์ของวันนี้</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((m) => (
              <button type="button" key={m} onClick={() => setForm({ ...form, mood: m })}
                className={`rounded-xl border px-3 py-1.5 text-xl transition ${form.mood === m ? 'border-stone-900 bg-stone-100' : 'border-stone-200 opacity-60 hover:opacity-100'}`}>
                {MOOD_EMOJI[m]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">เนื้อหา *</label>
          <textarea className="input min-h-32" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="เล่าเรื่องราวของวันนี้..." />
          {errors.content && <p className="err">{errors.content}</p>}
        </div>

        {/* เพิ่ม/เปลี่ยน/ลบรูปภาพ */}
        <ImagePicker imageUrl={imageUrl} file={file} onFile={setFile} onClear={() => { setFile(null); setImageUrl(null); }} error={errors.image} />

        {errors.form && <p className="err">{errors.form}</p>}
        <div className="flex justify-end gap-2">
          {editing && <button type="button" className="btn-ghost" onClick={cancel}>ยกเลิก</button>}
          <button className="btn-primary" disabled={saving}>{saving ? 'กำลังบันทึก...' : editing ? 'บันทึกการแก้ไข' : 'บันทึกไดอารี่'}</button>
        </div>
      </form>

      {/* ---------- ค้นหา + รายการ ---------- */}
      <input className="input" placeholder="🔍 ค้นหาไดอารี่..." value={q} onChange={(e) => setQ(e.target.value)} />

      {loading ? (
        <p className="py-10 text-center text-sm text-stone-400">กำลังโหลด...</p>
      ) : items.length === 0 ? (
        <div className="card py-12 text-center text-stone-400">ยังไม่มีไดอารี่</div>
      ) : (
        <div className="space-y-4">
          {items.map((d) => (
            <article key={d.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-stone-400">
                    {new Date(d.entryDate).toLocaleDateString('th-TH', { dateStyle: 'full', timeZone: 'UTC' })}
                  </p>
                  <h3 className="mt-0.5 font-semibold">{MOOD_EMOJI[d.mood]} {d.title || 'ไม่มีหัวข้อ'}</h3>
                </div>
                <div className="flex gap-1.5">
                  <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => edit(d)}>แก้ไข</button>
                  <button className="btn-danger !px-3 !py-1.5 text-xs" onClick={() => remove(d)}>ลบ</button>
                </div>
              </div>
              {d.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumb(d.imageUrl)} alt={d.title ?? 'รูปไดอารี่'} loading="lazy" className="mt-3 max-h-72 w-full rounded-xl object-cover" />
              )}
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-600">{d.content}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
