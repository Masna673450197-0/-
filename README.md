# 🌿 Mindful Tracker – Personal Preference & Review Tracker + Diary

ระบบบันทึกความประทับใจ/ความไม่พึงพอใจต่อ **บุคคล** และ **สิ่งของ/สถานที่/บริการ** พร้อมสถานะ "ปล่อยวาง" และ **ไดอารี่ประจำวัน**

**Tech stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma (PostgreSQL) · NextAuth.js · Zod

## ✨ ฟีเจอร์
| หมวด | รายละเอียด |
|------|-----------|
| Data Model | ชื่อ, ประเภท (บุคคล/สิ่งของ), ความรู้สึก (ประทับใจ/ไม่พึงพอใจ), ระดับ 1–5 ดาว, เหตุผล, สถานะ ACTIVE/RELEASED |
| CRUD | เพิ่ม / แสดง / แก้ไข / ลบ ทั้งรายการความรู้สึกและไดอารี่ |
| Validation | Zod ตรวจทั้ง Client และ Server (ชื่อบังคับ, เหตุผล ≥ 5 ตัวอักษร, ระดับ 1–5) |
| Search & Filter | ค้นหาชื่อ/เหตุผล + กรองประเภท + กรองความรู้สึก + กรองสถานะ + เรียงลำดับ |
| REST API | `GET/POST/PUT/DELETE` ใน `app/api/` |
| Authentication | NextAuth.js (อีเมล+รหัสผ่าน, JWT) + Middleware ป้องกันหน้า |
| รูปภาพ | เพิ่ม/เปลี่ยน/ลบรูปในรายการความรู้สึกและไดอารี่ (Cloudinary) ตรวจชนิด JPG/PNG/WEBP และขนาด ≤ 2 MB |
| Authorization | บทบาท USER / ADMIN, หน้า `/admin` เฉพาะแอดมิน (จัดการผู้ใช้), API ตอบ 403 ถ้าไม่มีสิทธิ์ |
| เสริม | สถิติสรุป, ปุ่มปล่อยวาง, Export CSV/JSON, ไดอารี่พร้อมอารมณ์รายวัน |

## 📦 วิธีติดตั้ง (รันในเครื่อง)
ต้องมี Node.js 18.17+ และฐานข้อมูล PostgreSQL 1 ตัว เลือกอย่างใดอย่างหนึ่ง:

**ตัวเลือก A: Neon (ฟรี ไม่ต้องลงอะไร – แนะนำ เพราะใช้ตอน deploy ได้ด้วย)**
1. สมัคร [neon.tech](https://neon.tech) → Create project → คัดลอก Connection String
2. ใส่ใน `.env` ทั้ง `DATABASE_URL` และ `DIRECT_URL` (ใช้ค่าเดียวกันได้)

**ตัวเลือก B: Docker (รัน Postgres ในเครื่อง)**
```bash
docker compose up -d
```
ใช้ค่าใน `.env.example` ได้เลย (คัดลอกเป็น `.env`)

แล้วรัน:
```bash
npm install                 # ติดตั้ง + สร้าง Prisma Client อัตโนมัติ
npx prisma db push          # สร้างตารางในฐานข้อมูล
npm run dev                 # รันที่ http://localhost:3000
```
ไฟล์ `.env` มี `NEXTAUTH_SECRET` สุ่มไว้ให้แล้ว แต่ **ต้องแก้ `DATABASE_URL` และ `DIRECT_URL`** เป็นของคุณ

## 🖼 ตั้งค่าอัปโหลดรูปภาพ (Cloudinary) – ไม่บังคับ
ถ้าไม่ตั้งค่า ระบบส่วนอื่นยังใช้ได้ปกติ แต่จะแนบรูปไม่ได้ (ขึ้นข้อความแจ้งเตือน)
1. สมัครฟรีที่ [cloudinary.com](https://cloudinary.com)
2. เข้า Dashboard คัดลอก **Cloud name, API Key, API Secret**
3. ใส่ใน `.env` (และใน Environment Variables ของ Vercel ด้วย)
```env
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```
4. รัน `npx prisma db push` อีกครั้ง (เพิ่มคอลัมน์รูป ข้อมูลเดิมไม่หาย) แล้วรีสตาร์ท `npm run dev`

**วิธีใช้:** ในฟอร์มกด "📷 เลือกรูป" → เห็นพรีวิว → "บันทึก" (รูปถูกอัปโหลดตอนกดบันทึก) ·
"🔄 เปลี่ยนรูป" ใช้เปลี่ยน · "🗑 ลบรูป" แล้วบันทึกเพื่อลบ (รูปเก่าบน Cloudinary ถูกลบด้วย) ·
ลบรายการหรือลบผู้ใช้ รูปจะถูกลบตามอัตโนมัติ

## ☁️ วิธี Deploy ขึ้น Vercel
1. สร้างฐานข้อมูล Neon และรัน `npx prisma db push` (ในเครื่อง โดยใช้ URL ของ Neon) **ครั้งเดียว** เพื่อสร้างตาราง
2. อัปโหลดโปรเจกต์ขึ้น GitHub (`.env` ไม่ถูกอัปเพราะอยู่ใน `.gitignore`)
3. ที่ [vercel.com](https://vercel.com): Add New → Project → เลือก repo
4. ตั้ง **Environment Variables** ก่อนกด Deploy:

| ชื่อ | ค่า |
|------|-----|
| `DATABASE_URL` | Connection String ของ Neon (แบบ pooled ก็ได้ ถ้ามี `-pooler` ให้ต่อท้าย `&pgbouncer=true`) |
| `DIRECT_URL` | Connection String แบบตรง (ไม่มี `-pooler`) หรือค่าเดียวกับ DATABASE_URL |
| `NEXTAUTH_SECRET` | ข้อความสุ่มยาว ๆ (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `https://ชื่อโปรเจกต์.vercel.app` |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | ค่าจาก Cloudinary (ถ้าใช้รูปภาพ) |

5. กด Deploy (Vercel จะรัน `prisma generate` ให้เองจาก `postinstall`)
6. สมัครสมาชิกคนแรก → จะได้เป็น ADMIN อัตโนมัติ

ถ้าล็อกอินไม่ได้หลัง deploy ให้เช็ค `NEXTAUTH_URL` และ `NEXTAUTH_SECRET` ก่อน

## 🚀 วิธีใช้งาน
1. เปิด `/register` สมัครสมาชิก (ล็อกอินให้อัตโนมัติ)
2. หน้า **ความรู้สึก**: กด "เพิ่มรายการ" → เลือกประเภท/ความรู้สึก/ดาว → ใส่เหตุผล → บันทึก
3. ใช้ช่องค้นหาและ chip กรองด้านบน, กด "🕊️ ปล่อยวาง" เมื่อผ่านเรื่องนั้นแล้ว
4. หน้า **ไดอารี่**: เลือกวันที่/อารมณ์ แล้วเขียนบันทึกประจำวัน
5. ปุ่ม ⬇ CSV / JSON ใช้ส่งออกข้อมูล

## 🔌 REST API
| Method | Endpoint | หน้าที่ |
|--------|----------|--------|
| GET | `/api/preferences?q=&kind=&sentiment=&status=&sort=` | ดึงรายการ + ค้นหา/กรอง + สถิติ |
| POST | `/api/preferences` | สร้างรายการ |
| GET/PUT/DELETE | `/api/preferences/:id` | ดู / แก้ไข / ลบ |
| GET/POST | `/api/diary` | ดึง / เพิ่มไดอารี่ |
| PUT/DELETE | `/api/diary/:id` | แก้ไข / ลบไดอารี่ |
| GET | `/api/export?format=csv\|json` | ส่งออกข้อมูล |
| POST/DELETE | `/api/upload` | อัปโหลดรูป (JPG/PNG/WEBP ≤ 2 MB) / ลบรูปที่ยังไม่ได้ใช้ |
| POST | `/api/register` | สมัครสมาชิก (คนแรกได้เป็น ADMIN) |
| GET | `/api/admin/users` | 🔒 ADMIN: รายชื่อผู้ใช้ + สถิติรวม |
| PUT/DELETE | `/api/admin/users/:id` | 🔒 ADMIN: เปลี่ยนบทบาท / ลบผู้ใช้ |

ทุก endpoint (ยกเว้น register) ต้องล็อกอิน และเข้าถึงได้เฉพาะข้อมูลของตัวเอง

## 🔐 Authentication vs Authorization
- **Authentication (ยืนยันตัวตน):** NextAuth ตรวจอีเมล+รหัสผ่าน ไม่ผ่านตอบ 401
- **Authorization (ตรวจสอบสิทธิ์):** ล็อกอินแล้วแต่ไม่ใช่ ADMIN เข้า `/admin` หรือ `/api/admin/*` ไม่ได้ ตอบ 403
  - ผู้ใช้ **คนแรก** ที่สมัครจะเป็น **ADMIN** อัตโนมัติ คนถัดไปเป็น USER
  - แอดมินเปลี่ยนบทบาทหรือลบบัญชีตัวเองไม่ได้ (กันระบบไม่มีผู้ดูแล)
  - แอดมินเห็นเฉพาะจำนวนรายการ ไม่เห็นเนื้อหาส่วนตัวของผู้ใช้
  - API ฝั่งแอดมินเช็ค role จากฐานข้อมูลทุกครั้ง ไม่เชื่อ role ใน token อย่างเดียว

> ต้องการแก้ role ผู้ใช้ด้วยตนเอง: `npx prisma studio` แล้วแก้คอลัมน์ `role`

## 🗂 โครงสร้าง & ไฟล์สำคัญสำหรับนำเสนอ
```
prisma/schema.prisma              โครงสร้างฐานข้อมูล (User, Preference, DiaryEntry)
app/api/preferences/route.ts      GET (Search/Filter/Sort) + POST (Create)
app/api/preferences/[id]/route.ts GET/PUT/DELETE รายการเดียว + ตรวจความเป็นเจ้าของ
app/preferences/page.tsx          หน้า UI หลัก + Search & Filter
components/PreferenceForm.tsx     ฟอร์ม + Validation ฝั่ง Client
lib/validation.ts                 กฎ Validation (ใช้ร่วม Client/Server)
lib/auth.ts, middleware.ts        NextAuth + การป้องกันหน้า
```

## 💡 จุดที่อธิบายอาจารย์ได้
- **Validation 2 ชั้น:** schema เดียวกัน (`lib/validation.ts`) ตรวจที่ฟอร์มก่อน แล้วตรวจซ้ำที่ API
- **ความปลอดภัย:** รหัสผ่าน hash ด้วย bcrypt, session เป็น JWT, ทุก query ผูก `userId`
- **รูปภาพ:** อัปโหลดแบบ signed จากฝั่ง Server (API Secret ไม่หลุดไปเบราว์เซอร์), ตรวจชนิด/ขนาดทั้ง 2 ฝั่ง, แต่ละคนมีโฟลเดอร์ของตัวเอง และ Server ตรวจว่ารูปที่ส่งมาเป็นของผู้ใช้คนนั้นจริงก่อนบันทึก/ลบ
- **Search/Filter:** ประกอบเงื่อนไข `where` ของ Prisma แบบ dynamic ใน `GET /api/preferences`
- **ค่าที่กำหนดตายตัว (ประเภท/ความรู้สึก/สถานะ/role):** เก็บเป็น String แล้วบังคับค่าด้วย Zod

## 📝 หมายเหตุ
- ตอน deploy ให้ตั้ง `NEXTAUTH_URL` และ `NEXTAUTH_SECRET` ใหม่
