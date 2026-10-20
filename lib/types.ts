// Type และข้อความแสดงผลที่ใช้ร่วมกันทั้งระบบ

export type Kind = 'PERSON' | 'THING';
export type Sentiment = 'LIKED' | 'DISLIKED';
export type Status = 'ACTIVE' | 'RELEASED';
export type Role = 'USER' | 'ADMIN';

export interface Preference {
  id: string;
  name: string;
  kind: Kind;
  sentiment: Sentiment;
  level: number;
  reason: string;
  imageUrl: string | null;
  imagePublicId: string | null;
  status: Status;
  releasedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DiaryEntry {
  id: string;
  title: string | null;
  content: string;
  mood: number;
  imageUrl: string | null;
  imagePublicId: string | null;
  entryDate: string;
  createdAt: string;
  updatedAt: string;
}

export const KIND_LABEL: Record<Kind, string> = { PERSON: 'บุคคล', THING: 'สิ่งของ/สถานที่/บริการ' };
export const SENTIMENT_LABEL: Record<Sentiment, string> = { LIKED: 'ประทับใจ', DISLIKED: 'ไม่พึงพอใจ' };
export const STATUS_LABEL: Record<Status, string> = { ACTIVE: 'บันทึกไว้', RELEASED: 'ปล่อยวางแล้ว' };
export const ROLE_LABEL: Record<Role, string> = { USER: 'ผู้ใช้ทั่วไป', ADMIN: 'ผู้ดูแลระบบ' };
export const LEVEL_LABEL: Record<number, string> = {
  1: 'เล็กน้อย', 2: 'พอสมควร', 3: 'ปานกลาง', 4: 'มาก', 5: 'ขั้นสุด/ฝังใจ',
};
export const MOOD_EMOJI: Record<number, string> = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' };
