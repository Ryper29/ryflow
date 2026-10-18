# 🏝️ Ryflow

> **Sleek Dynamic Island & Live Synced Lyrics for Windows**  
> *Kontrol musik dan lirik langsung di atas layar tanpa ribet berpindah jendela.*

---

## 💡 Tentang Ryflow

**Ryflow** adalah aplikasi desktop bergaya *Dynamic Island* (notch) yang selalu mengapung di bagian atas layar Windows. Ryflow terhubung langsung dengan sistem media Windows (GSMTC) untuk mendeteksi lagu yang sedang diputar di Spotify, Apple Music, YouTube Music, maupun browser, lengkap dengan lirik berjalan (*synced lyrics*) yang diambil secara otomatis.

---

## ✨ Fitur Utama

- 🏝️ **Floating Dynamic Island:**
  - Notch minimalis di bagian atas layar dengan animasi spring mulus (*Framer Motion*).
  - Tembus klik (*click-through*) di area transparan saat idle agar tidak mengganggu aktivitas kerja.
  - Mengembang (*expanded*) saat kursor diarahkan (*hover*).

- 🎵 **Integrasi Media Windows Real-Time:**
  - Membaca judul, nama artis, cover art, dan durasi dari sistem Windows GSMTC via background bridge PowerShell.
  - Progress bar presisi dengan interpolasi lokal yang mulus dan fitur *click-to-seek*.
  - Kontrol langsung: Play/Pause, Next Track, Previous Track.

- 💿 **Vinyl Effect (Idle Pill):**
  - Cover album mini berbentuk piringan vinyl berputar lambat saat musik diputar, dan berhenti saat musik dijeda.

- 📜 **Auto Synced Lyrics & HD Artwork:**
  - Lirik otomatis diambil dari `lrclib.net` (synced LRC dengan fallback plain text).
  - Tampilan lirik 3 baris: baris sebelumnya (redup), baris aktif (fokus terang), dan baris berikutnya.
  - Fallback cover art resolusi tinggi dari iTunes Search API.

- 🚀 **Standalone & Auto-Start:**
  - Bebas localhost — berjalan sebagai aplikasi desktop `.exe` mandiri.
  - Otomatis berjalan saat laptop dinyalakan (*open at login*).
  - *Single Instance Lock* — mencegah aplikasi terbuka dobel.
  - *System Tray Menu* di pojok kanan bawah Windows untuk reload atau keluar kapan saja.

---

## 🛠️ Tech Stack

- **Desktop Framework:** [Electron 44](https://www.electronjs.org/)
- **Frontend:** [React 19](https://react.dev/), [Vite](https://vite.dev/)
- **Styling & Animasi:** [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Typography:** Plus Jakarta Sans (UI), Fraunces (Lyrics), DM Mono (Time & Clock)
- **Media Engine:** Windows Runtime (WinRT) GSMTC via PowerShell Child Process
- **Lyrics Provider:** [LRCLIB API](https://lrclib.net/) & iTunes Search API
- **Packager:** [electron-builder](https://www.electron.build/)

---

## 📦 Menjalankan & Membangun Project

### Prasyarat
- **Node.js** (v18+ disarankan)
- **Windows 10/11** (mendukung Windows GSMTC)

### 1. Mode Development
Menjalankan Vite dev server + Electron secara bersamaan:
```bash
npm install
npm run electron:dev
```

### 2. Build Installer Desktop (.exe)
Mengemas seluruh aplikasi menjadi installer NSIS yang siap di-install di Windows:
```bash
npm run electron:build
```
Hasil installer akan tersimpan di dalam folder `release/`:
- **Installer:** `release/Ryflow Setup <versi>.exe`
- **Portable Unpacked:** `release/win-unpacked/Ryflow.exe`

---

## 📋 Catatan Rilis & Changelog

Dokumentasi perubahan versi tercatat secara rinci di [`docs/CHANGES.md`](./docs/CHANGES.md).

---

## 👤 Pembuat

Dibuat dengan ❤️ oleh **Ryper**  
*Musik yang mengalir (flow) tanpa hambatan.*
