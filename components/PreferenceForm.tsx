'use client';
import { useState } from 'react';
import { preferenceSchema, PreferenceInput, toFieldErrors } from '@/lib/validation';
import { Preference, KIND_LABEL, SENTIMENT_LABEL, LEVEL_LABEL } from '@/lib/types';
import { removeUploaded, uploadImageFile } from '@/lib/image';
import Stars from './Stars';
import ImagePicker from './ImagePicker';

interface Props {
  initial: Preference | null;   // null = โหมดเพิ่มใหม่, มีค่า = โหมดแก้ไข
  onClose: () => void;
  onSaved: () => void;
}

// ฟอร์ม (Modal) สำหรับ Create / Update รายการความรู้สึก
export default function PreferenceForm({ initial, onClose, onSaved }: Props) {
  const isEdit = !!initial;
  const [form, setForm] = useState<PreferenceInput>({
    name: initial?.name ?? '',
    kind: initial?.kind ?? 'PERSON',
    sentiment: initial?.sentiment ?? 'LIKED',
    level: initial?.level ?? 3,
    reason: initial?.reason ?? '',
    status: initial?.status ?? 'ACTIVE',
  });
  // สถานะรูปภาพ: imageUrl = รูปเดิม (null เมื่อกดลบ), file = ไฟล์ใหม่ที่เลือกแต่ยังไม่อัปโหลด
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof PreferenceInput>(k: K, v: PreferenceInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    // ขั้นที่ 1: Validation ฝั่ง Client (ใช้ schema เดียวกับ Server) แจ้งเตือนทันทีโดยไม่ต้องยิง API
    const parsed = preferenceSchema.safeParse(form);
    if (!parsed.success) return setErrors(toFieldErrors(parsed.error));
    setErrors({});
    setSaving(true);

    // ขั้นที่ 2: จัดการรูปภาพ
    //   - เลือกไฟล์ใหม่      -> อัปโหลดก่อน แล้วแนบ url/publicId ไปกับรายการ
    //   - กดลบรูปเดิม        -> ส่ง null เพื่อให้ Server ลบรูป
    //   - ไม่ยุ่งกับรูป      -> ไม่ส่งฟิลด์รูป (Server คงรูปเดิมไว้)
    let imageFields: { imageUrl?: string | null; imagePublicId?: string | null } = {};
    let uploadedId: string | null = null;
    try {
      if (file) {
        const up = await uploadImageFile(file);
        uploadedId = up.publicId;
        imageFields = { imageUrl: up.url, imagePublicId: up.publicId };
      } else if (isEdit && initial!.imageUrl && imageUrl === null) {
        imageFields = { imageUrl: null, imagePublicId: null };
      }
    } catch (err) {
      setSaving(false);
      return setErrors({ image: err instanceof Error ? err.message : 'อัปโหลดรูปไม่สำเร็จ' });
    }

    // ขั้นที่ 3: ส่งไป API — แก้ไขใช้ PUT, เพิ่มใหม่ใช้ POST
    const res = await fetch(isEdit ? `/api/preferences/${initial!.id}` : '/api/preferences', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...parsed.data, ...imageFields }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);

    // ขั้นที่ 4: ถ้า Server ปฏิเสธ ให้แสดง error และลบรูปที่เพิ่งอัปโหลด (กันรูปค้างบนคลาวด์)
    if (!res.ok) {
      if (uploadedId) await removeUploaded(uploadedId);
      return setErrors(data.fieldErrors ?? { form: data.error ?? 'บันทึกไม่สำเร็จ' });
    }
    onSaved();
  }

  // ปุ่มสลับตัวเลือก (ใช้กับ ประเภท / ความรู้สึก)
  const toggle = (active: boolean, tone: string) =>
    `flex-1 rounded-xl border px-3 py-2 text-sm transition ${active ? tone : 'border-stone-200 text-stone-500 hover:bg-stone-50'}`;

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-stone-900/30 p-4 sm:items-center" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="card max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto">
        <h2 className="text-lg font-semibold">{isEdit ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}</h2>

        <div>
          <label className="label">ชื่อบุคคล / สิ่งของ / สถานที่ / บริการ *</label>
          <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="เช่น ร้านกาแฟหน้าปากซอย" />
          {errors.name && <p className="err">{errors.name}</p>}
        </div>

        <div>
          <label className="label">ประเภท</label>
          <div className="flex gap-2">
            {(['PERSON', 'THING'] as const).map((k) => (
              <button type="button" key={k} onClick={() => set('kind', k)} className={toggle(form.kind === k, 'border-stone-900 bg-stone-900 text-white')}>
                {KIND_LABEL[k]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">ความรู้สึก</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => set('sentiment', 'LIKED')} className={toggle(form.sentiment === 'LIKED', 'border-emerald-300 bg-emerald-50 text-emerald-700')}>
              💚 {SENTIMENT_LABEL.LIKED}
            </button>
            <button type="button" onClick={() => set('sentiment', 'DISLIKED')} className={toggle(form.sentiment === 'DISLIKED', 'border-rose-300 bg-rose-50 text-rose-700')}>
              💔 {SENTIMENT_LABEL.DISLIKED}
            </button>
          </div>
        </div>

        <div>
          <label className="label">ระดับความรู้สึก (1 = {LEVEL_LABEL[1]}, 5 = {LEVEL_LABEL[5]})</label>
          <div className="flex items-center gap-3">
            <Stars value={form.level} onChange={(v) => set('level', v)} />
            <span className="text-sm text-stone-500">{LEVEL_LABEL[form.level]}</span>
          </div>
          {errors.level && <p className="err">{errors.level}</p>}
        </div>

        <div>
          <label className="label">เหตุผล: ชอบ/ไม่ชอบเพราะอะไร * (อย่างน้อย 5 ตัวอักษร)</label>
          <textarea className="input min-h-28" value={form.reason} onChange={(e) => set('reason', e.target.value)} placeholder="อธิบายความรู้สึกและเหตุผลอย่างละเอียด..." />
          {errors.reason && <p className="err">{errors.reason}</p>}
        </div>

        {/* ส่วนเพิ่ม/เปลี่ยน/ลบรูปภาพ */}
        <ImagePicker
          imageUrl={imageUrl}
          file={file}
          onFile={setFile}
          onClear={() => { setFile(null); setImageUrl(null); }}
          error={errors.image}
        />

        {isEdit && (
          <div>
            <label className="label">สถานะ</label>
            <select className="input" value={form.status} onChange={(e) => set('status', e.target.value as PreferenceInput['status'])}>
              <option value="ACTIVE">ACTIVE – บันทึกไว้</option>
              <option value="RELEASED">RELEASED – ปล่อยวางแล้ว</option>
            </select>
          </div>
        )}

        {errors.form && <p className="err">{errors.form}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button className="btn-primary" disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
        </div>
      </form>
    </div>
  );
}
