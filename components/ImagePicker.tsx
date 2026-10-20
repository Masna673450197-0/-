'use client';
import { useEffect, useRef, useState } from 'react';
import { IMAGE_MAX_MB, IMAGE_TYPES, thumb, validateImageFile } from '@/lib/image';

interface Props {
  imageUrl: string | null;          // รูปเดิมที่บันทึกไว้แล้ว (ถ้ามี)
  file: File | null;                // ไฟล์ใหม่ที่เพิ่งเลือก (ยังไม่อัปโหลด)
  onFile: (f: File) => void;
  onClear: () => void;              // กด "ลบรูป"
  error?: string;
}

// ส่วนเลือก/พรีวิว/ลบรูป ใช้ร่วมกันทั้งฟอร์มความรู้สึกและไดอารี่
// หมายเหตุ: ไฟล์จะถูกอัปโหลดตอนกด "บันทึก" เท่านั้น ถ้ายกเลิกก็ไม่มีรูปค้างบนคลาวด์
export default function ImagePicker({ imageUrl, file, onFile, onClear, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState('');

  // สร้าง URL ชั่วคราวสำหรับพรีวิวไฟล์ที่เลือก และคืนหน่วยความจำเมื่อเปลี่ยน/ปิด
  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';                       // รีเซ็ต เพื่อให้เลือกไฟล์เดิมซ้ำได้
    if (!f) return;
    const msg = validateImageFile(f);          // Validation ฝั่ง Client
    if (msg) return setLocalError(msg);
    setLocalError('');
    onFile(f);
  }

  const shown = preview ?? (imageUrl ? thumb(imageUrl, 600) : null);
  const msg = localError || error;

  return (
    <div>
      <label className="label">รูปภาพ (ไม่บังคับ · JPG/PNG/WEBP ไม่เกิน {IMAGE_MAX_MB} MB)</label>
      {shown && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shown} alt="พรีวิวรูปภาพ" className="mb-2 max-h-48 w-full rounded-xl border border-stone-200 object-cover" />
      )}
      <div className="flex gap-2">
        <button type="button" className="btn-ghost !py-1.5 text-xs" onClick={() => inputRef.current?.click()}>
          {shown ? '🔄 เปลี่ยนรูป' : '📷 เลือกรูป'}
        </button>
        {shown && (
          <button type="button" className="btn-danger !py-1.5 text-xs" onClick={() => { setLocalError(''); onClear(); }}>
            🗑 ลบรูป
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept={IMAGE_TYPES.join(',')} className="hidden" onChange={pick} />
      {msg && <p className="err">{msg}</p>}
    </div>
  );
}
