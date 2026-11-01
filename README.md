# 🏝️ Ryflow

> **Smart productivity hub berbentuk notch untuk Windows.**
> *Musik & lirik tersinkron, cuaca & agenda harian, dan asisten AI — semuanya di tepi atas layar, tanpa berpindah jendela.*

**Status:** versi 0.x, dipakai pribadi dan masih terus berkembang.

---

## 💡 Tentang Ryflow

**Ryflow** adalah aplikasi desktop bergaya *Dynamic Island* / notch MacBook yang selalu mengapung di bagian atas layar Windows. Ia lahir dari satu keluhan sederhana: memutar lagu berikutnya atau melihat lirik terasa ribet karena harus berpindah jendela. Dari situ Ryflow berkembang menjadi hub kecil dengan tiga tab:

| Tab | Fungsi |
|---|---|
| 🎵 **Music** | Kontrol pemutar media Windows + lirik tersinkron |
| 🗓️ **Today** | Cuaca, kalender mingguan, dan agenda/to-do harian |
| 🤖 **AI** | Asisten AI yang mengenali konteks (lagu, cuaca, agenda) |

---

## ✨ Fitur Utama

### 🏝️ Notch yang Selalu Ada, Tidak Mengganggu
- Siluet notch ala MacBook dengan animasi spring (*Framer Motion*).
- **Idle:** pill kecil berisi cover vinyl, jam digital, dan indikator gelombang. Seluruh area pill *tembus klik* sehingga tab browser di belakangnya tetap bisa diklik.
- **Membuka:** dorong kursor mentok ke **tepi paling atas layar** (±6px). Notch terbuka instan tanpa delay.
- **Pin:** sematkan notch agar tetap terbuka walau kursor pergi.
- **Auto-hold:** notch tidak menutup selama kamu sedang mengetik di kolom input.

### 🎵 Tab Music
- Membaca judul, artis, cover, posisi, dan durasi dari **Windows GSMTC** (Spotify, Apple Music, YouTube Music, browser) lewat jembatan PowerShell di background.
- Kontrol Play/Pause, Next, Previous, dan *click-to-seek* pada progress bar.
- Cover album mini berbentuk **piringan vinyl** yang berputar saat musik diputar dan berhenti saat dijeda.
- **Lirik tersinkron otomatis** dari [LRCLIB](https://lrclib.net/) (fallback ke lirik teks biasa), tampil 3 baris: sebelumnya (redup), aktif (terang), berikutnya.
- Parser judul YouTube (`Artis - Judul`, pembersihan `(Official Video)`, VEVO/Topic, dll.) agar lirik tetap ketemu saat memutar dari browser.
- Fallback cover art resolusi tinggi dari iTunes Search API.

### 🗓️ Tab Today
- **Cuaca real-time** dari [Open-Meteo](https://open-meteo.com/) (suhu, kelembapan, kondisi dalam bahasa Indonesia), diperbarui tiap 15 menit.
- **Lokasi** dari Geolocation browser, dengan fallback ke geolokasi IP, lalu ke Bandar Lampung. Nama kota dari reverse geocoding OpenStreetMap Nominatim.
- **Kalender mingguan** 7 hari dengan hari ini disorot.
- **Agenda / to-do cepat:** tambah, centang, hapus, dengan penghitung progres. Disimpan di `localStorage`.

### 🤖 Tab AI
- Asisten AI **bring-your-own-key**. Provider terdeteksi otomatis dari prefix key: **Google Gemini**, **Grok (xAI) / Groq**, **OpenAI**, dan **Anthropic**.
- Model Gemini ditemukan dinamis dari akun kamu, dan bisa diganti dengan klik badge model.
- Mengenali konteks: lagu yang sedang diputar, cuaca, jam, dan agenda yang belum selesai.
- Tombol cepat: **🎵 Makna lagu ini** dan **⚡ Fokus hari ini**, plus salin jawaban dan pesan error yang ramah.
- API key disimpan terenkripsi lewat Electron `safeStorage` (Windows DPAPI), bukan `localStorage`.

### 🚀 Aplikasi Mandiri
- Berjalan sebagai `.exe` tanpa localhost.
- Otomatis berjalan saat Windows menyala (hanya pada build terpaket).
- *Single instance lock* dan menu *system tray* (fokus, reload, keluar).

---

## 🔒 Privasi & Layanan Eksternal

Ryflow berjalan lokal, tetapi beberapa fitur memanggil layanan pihak ketiga:

| Layanan | Untuk apa | Data yang dikirim |
|---|---|---|
| LRCLIB | Lirik | Judul & artis lagu yang sedang diputar |
| iTunes Search API | Cover art cadangan | Judul & artis lagu |
| Open-Meteo | Cuaca | Koordinat lokasi |
| geojs.io | Geolokasi IP (fallback) | Alamat IP |
| Nominatim (OpenStreetMap) | Nama kota | Koordinat lokasi |
| Provider AI pilihanmu | Tab AI | Pertanyaan **beserta konteks**: lagu, cuaca, jam, dan teks agenda yang belum selesai |

Pertanyaan ke AI selalu menyertakan konteks di atas. Hindari menulis informasi sensitif di agenda jika memakai fitur AI.

---

## 🛠️ Tech Stack

- **Desktop:** [Electron 44](https://www.electronjs.org/)
- **Frontend:** [React 19](https://react.dev/), [Vite](https://vite.dev/)
- **Styling & Animasi:** [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
- **Ikon:** [Lucide React](https://lucide.dev/)
- **Tipografi:** Plus Jakarta Sans (UI & lirik), DM Mono (jam & timer)
- **Media engine:** Windows Runtime (WinRT) GSMTC via PowerShell child process
- **Sumber data:** LRCLIB, iTunes Search API, Open-Meteo, Nominatim, geojs.io
- **Kualitas:** [Vitest](https://vitest.dev/) (unit test), oxlint
- **Packager:** [electron-builder](https://www.electron.build/) (installer NSIS)

---

## 🗂️ Struktur Proyek

```
src/
├── components/
│   └── Header.jsx          # Header idle & expanded
├── hooks/
│   ├── useClock.js
│   ├── useMedia.js
│   ├── useWeather.js
│   ├── useTodos.js
│   └── useAiAgent.js
├── services/
│   ├── lyrics.js
│   ├── weather.js
│   ├── ai.js
│   └── media.js
├── App.jsx                 # Orkestrator: notch, tab, animasi
└── main.jsx
electron/
├── main.cjs                # Window, CSP, IPC, safeStorage, media bridge
├── preload.cjs
├── media-bridge.ps1        # Jembatan GSMTC (PowerShell)
└── tray.png
tests/                      # Vitest untuk services
```

---

## 📦 Menjalankan & Membangun

### Prasyarat
- **Node.js** v18+ disarankan
- **Windows 10/11** (butuh Windows GSMTC)

### Development
Menjalankan Vite dev server dan Electron bersamaan:
```bash
npm install
npm run electron:dev
```

### Test & Kualitas
```bash
npm run test       # Vitest
npm run lint       # oxlint
npm run build      # build Vite
```

### Build Installer (.exe)
```bash
npm run electron:build
```
Hasil di folder `release/`:
- **Installer:** `release/Ryflow Setup <versi>.exe`
- **Portable:** `release/win-unpacked/Ryflow.exe`

---

## ⚠️ Batasan yang Diketahui

- Ditempatkan di **monitor utama** saja.
- Jembatan media memakai **PowerShell polling**, bukan event native, jadi ada jeda kecil dan konsumsi sumber daya yang masih bisa dioptimalkan.
- Akurasi sinkron lirik bergantung pada data LRCLIB dan presisi posisi dari GSMTC; belum ada penyesuaian offset manual.
- Pemutar yang sedang berstatus *Playing* dipilih otomatis, sehingga video di tab browser bisa menimpa Spotify.
- Installer belum dirancang untuk distribusi publik.

---

## 📋 Catatan Rilis

Riwayat perubahan lengkap ada di [`docs/CHANGES.md`](./docs/CHANGES.md).

---

## 👤 Pembuat

Dibuat dengan ❤️ oleh **Ryper**
*Satu notch kecil, semua yang kamu butuhkan, tanpa berpindah jendela.*