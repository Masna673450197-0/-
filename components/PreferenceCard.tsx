'use client';
import { Preference, KIND_LABEL, LEVEL_LABEL, SENTIMENT_LABEL } from '@/lib/types';
import Stars from './Stars';
import { thumb } from '@/lib/image';

interface Props {
  item: Preference;
  onEdit: (p: Preference) => void;
  onDelete: (p: Preference) => void;
  onToggleRelease: (p: Preference) => void;
}

// การ์ดแสดง 1 รายการ: สีเขียว = ประทับใจ, สีแดง = ไม่พึงพอใจ, จางลง = ปล่อยวางแล้ว
export default function PreferenceCard({ item, onEdit, onDelete, onToggleRelease }: Props) {
  const liked = item.sentiment === 'LIKED';
  const released = item.status === 'RELEASED';

  return (
    <article className={`card flex flex-col gap-3 border-l-4 ${liked ? 'border-l-emerald-400' : 'border-l-rose-400'} ${released ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-stone-900">{item.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-stone-600">{item.kind === 'PERSON' ? '👤' : '📦'} {KIND_LABEL[item.kind]}</span>
            <span className={`rounded-full px-2.5 py-0.5 ${liked ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {liked ? '💚' : '💔'} {SENTIMENT_LABEL[item.sentiment]}
            </span>
            {released && <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-sky-700">🕊️ ปล่อยวางแล้ว</span>}
          </div>
        </div>
        <div className="text-right">
          <Stars value={item.level} />
          <p className="text-xs text-stone-400">{LEVEL_LABEL[item.level]}</p>
        </div>
      </div>

      {item.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb(item.imageUrl)} alt={item.name} loading="lazy" className="max-h-56 w-full rounded-xl object-cover" />
      )}

      <p className="whitespace-pre-line text-sm leading-relaxed text-stone-600">{item.reason}</p>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3">
        <span className="text-xs text-stone-400">{new Date(item.createdAt).toLocaleDateString('th-TH', { dateStyle: 'medium' })}</span>
        <div className="flex gap-1.5">
          <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => onToggleRelease(item)}>
            {released ? '↩︎ บันทึกกลับ' : '🕊️ ปล่อยวาง'}
          </button>
          <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => onEdit(item)}>แก้ไข</button>
          <button className="btn-danger !px-3 !py-1.5 text-xs" onClick={() => onDelete(item)}>ลบ</button>
        </div>
      </div>
    </article>
  );
}
