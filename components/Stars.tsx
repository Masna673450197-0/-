'use client';

// แสดงดาว 1-5 (ถ้าส่ง onChange มาด้วย จะกดเลือกระดับได้)
export default function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <span className="inline-flex gap-0.5" role={onChange ? 'radiogroup' : undefined}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          aria-label={`${n} ดาว`}
          className={`text-lg leading-none ${n <= value ? 'text-amber-400' : 'text-stone-200'} ${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
        >
          ★
        </button>
      ))}
    </span>
  );
}
