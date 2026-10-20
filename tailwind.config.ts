import type { Config } from 'tailwindcss';

// บอก Tailwind ว่าให้สแกนหา class ในไฟล์ไหนบ้าง
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
export default config;
