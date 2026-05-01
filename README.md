# ANS Schedule Dashboard

## Overview
Dashboard manajemen jadwal kelas bahasa Jepang untuk ANS. Fitur utama: master data sensei dan student, kalender jadwal mingguan/bulanan, lesson tracker untuk absensi dan progress, reporting analytics, serta integrasi optional ke Google Sheets via Apps Script.

## Tech Stack
- React 19 + TypeScript
- Vite 6 (build tool)
- Tailwind CSS 4 (styling)
- Supabase (auth & database)
- Recharts (chart)
- Motion (animasi)
- Sonner (toast notification)
- date-fns (date handling)
- xlsx (export Excel)

## Prerequisites
- Node.js 18 atau lebih baru
- Akun Supabase (free tier cukup)
- (Optional) Google Apps Script URL untuk sync ke Sheets

## Setup

1. Clone atau download repo ini, lalu masuk ke folder project
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy file .env.example menjadi .env.local:
   ```bash
   cp .env.example .env.local
   ```
4. Buka `.env.local`, isi value-nya:
   - `VITE_SUPABASE_URL`: didapat dari Supabase dashboard → Project Settings → API → Project URL
   - `VITE_SUPABASE_ANON_KEY`: didapat dari Supabase dashboard → Project Settings → API → anon public key
5. Pastikan tabel-tabel berikut sudah ada di Supabase database:
   - `sensei`
   - `students`
   - `offdays`
   - `schedules`
   - `lesson_trackers`
6. Jalankan development server:
   ```bash
   npm run dev
   ```
   Aplikasi akan jalan di http://localhost:3000
7. Untuk production build:
   ```bash
   npm run build
   ```

## Features

- Authentication via Supabase (login & signup)
- Master data sensei dengan info kontak dan level mengajar
- Master data student dengan info pembayaran dan link resource
- Kalender jadwal dengan view week/month
- Schedule builder dengan deteksi bentrok jam dan off day sensei
- Lesson tracker untuk absensi, materi, score, dan notes
- Reporting dashboard dengan chart workload sensei dan tren mingguan
- Smart Checker untuk validasi konflik jadwal
- Export data ke Excel
- Dark mode support
- Sync optional ke Google Sheets

## Project Structure
```text
/
├── public/             # Static assets (if any)
├── src/
│   ├── components/     # UI components (AuthPage, ErrorBoundary)
│   ├── App.tsx         # Main application and state management
│   ├── main.tsx        # React entry point
│   ├── index.css       # Global styles with Tailwind CSS
│   └── vite-env.d.ts   # Vite environment types
├── .env.example        # Example environment variables
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── vite.config.ts      # Vite configuration
```

## Environment Variables

| Variable                 | Required | Description                              |
|--------------------------|----------|------------------------------------------|
| `VITE_SUPABASE_URL`      | Ya       | URL project Supabase                     |
| `VITE_SUPABASE_ANON_KEY` | Ya       | Anon key dari Supabase dashboard         |

## Admin Access

Email yang terdaftar sebagai super admin dapat dilihat di `src/App.tsx` pada constant `ADMIN_EMAILS`. Super admin punya akses ke Sync Settings dan User Management.

## Lisensi

Internal use only - ANS.