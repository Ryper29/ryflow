# 📋 ryflow — Catatan Perubahan & Dokumentasi Pribadi

> File ini dibuat untuk mendokumentasikan setiap perubahan signifikan yang dilakukan pada project ini.

---

## 🧠 Filosofi Project

**RyperFlow** lahir dari rasa frustrasi sederhana:  
*"Kadang agak ribet dan lama saat ingin memutar lagu berikutnya atau melihat liriknya."*

Solusinya bukan app musik baru — melainkan sebuah **notch/island** yang selalu hadir di atas layar, siap kapanpun dibutuhkan, tanpa harus berpindah jendela atau membuka aplikasi lain.

**Tujuan utama:** Kontrol musik dan lirik yang langsung, cepat, dan tidak bikin ribet.

**Dibuat oleh:** Ryper

---

## 📌 Versi & Perubahan

---

### [v0.1.0] — 2026-10-19

#### ♻️ Rename Project: `ryflow` → `ryper-flow`

**Alasan:** Nama baru lebih personal (mengandung nama Ryper) dan mencerminkan filosofi project — musik yang mengalir (*flow*) tanpa hambatan.

**File yang diubah:**

| File | Perubahan |
|------|-----------|
| `package.json` | `"name"` diubah dari `"ryflow"` → `"ryper-flow"` |
| `index.html` | `<title>` diubah dari `"ryflow"` → `"RyperFlow"` |
| Nama folder | Diubah dari `ryflow/` → `ryper-flow/` *(lakukan manual jika editor masih membuka folder)* |

**File yang TIDAK perlu diubah:**
- `vite.config.js` — tidak mengandung nama project
- `electron/main.cjs` — tidak mengandung nama project
- `electron/preload.cjs` — tidak mengandung nama project
- Semua file di `src/` — tidak mengandung nama project

---

### [v0.1.1] — 2026-10-19

#### ♻️ Rename Project: `ryper-flow` → `ryflow`

**Alasan:** Nama `ryflow` lebih compact, punchy, dan terasa lebih seperti nama app profesional dibanding `ryper-flow`. Filosofi "flow" tetap terjaga.

**File yang diubah:**

| File | Perubahan |
|------|-----------|
| `package.json` | `"name"` diubah dari `"ryper-flow"` → `"ryflow"` |
| `index.html` | `<title>` diubah dari `"RyperFlow"` → `"ryflow"` |
| Nama folder | Diubah dari `ryper-flow/` → `ryflow/` *(lakukan manual jika editor masih membuka folder)* |

---

### [v0.1.2] — 2026-10-19

#### 🧹 Cleanup: Hapus sisa kata `"Nusa"` di seluruh project

**Alasan:** Masih ada sisa referensi nama lama (`nusa-notch`) dan teks UI (`Nusa Music`) yang tertinggal dari versi awal project sebelum rename.

**File yang diubah:**

| File | Perubahan |
|------|-----------|
| `package-lock.json` | `"name"` diubah dari `"nusa-notch"` → `"ryflow"` (baris 2 & 8) |
| `src/App.jsx` | Teks UI `"Nusa Music"` → `"ryflow"` (baris 136) |
| `docs/CHANGES.md` | Semua referensi `nusa-notch` → `ryflow` (baris 26, 34, 35, 36) |

**Cara ditemukan:** Pencarian rekursif `Select-String -Pattern "Nusa"` di seluruh file project (exclude `node_modules`, `.git`, `.next`).

---

### [v0.1.3] — 2026-10-19

#### 🎨 Custom Font: Plus Jakarta Sans + Fraunces + DM Mono

**Alasan:** Font sistem default terasa kaku dan generik (*AI-slop*). Diganti dengan font custom yang lebih hangat, manusiawi, dan premium — mengacu pada estetika UI musik Apple.

**Font yang dipilih:**

| Peran | Font | Alasan |
|-------|------|--------|
| UI umum | **Plus Jakarta Sans** | Modern tapi bulat dan hangat, lebih punya karakter daripada Inter, tetap rapi di ukuran 10–13px |
| Lirik | **Fraunces** (italic) | Serif old-style bergaya ekspresif, italic-nya terasa puitis dan natural untuk teks lagu |
| Monospace | **DM Mono** | Monospace berbentuk lembut, jam & timer tetap rapi tanpa terlihat kaku seperti Courier |

**File yang diubah:**

| File | Perubahan |
|------|-----------|
| `index.html` | Tambah `<link rel="preconnect">` dan `<link>` Google Fonts (display=swap) untuk ketiga font |
| `src/index.css` | Tambah blok `@theme {}` berisi `--font-sans`, `--font-lyric`, `--font-mono` (cara Tailwind v4) |
| `src/App.jsx` | Update Tailwind class font di seluruh elemen UI (hanya font, logic/animasi tidak disentuh) |

**Mapping perubahan class di `App.jsx`:**

| Elemen | Sebelum | Sesudah |
|--------|---------|---------|
| Idle pill wrapper | `font-semibold` | `font-sans font-semibold` |
| Jam digital (idle) | `font-mono` | `font-mono font-medium` |
| Nama app "ryflow" | `font-medium` | `font-sans font-semibold` |
| Label "Lyrics Live" | `font-medium` | `font-sans font-medium` |
| Judul lagu | `font-bold` | `font-sans font-bold` |
| Nama artis | *(default)* | `font-sans` |
| Lirik aktif & sekitar | `font-bold` / `font-medium` | `font-lyric italic font-bold` / `font-lyric italic font-medium` |
| Tanggal & jam (expanded) | `font-mono` | `font-mono` *(otomatis DM Mono)* |
| Timer progress bar | `font-mono` | `font-mono` *(otomatis DM Mono)* |

**Catatan teknis:**
- DM Mono hanya tersedia weight 400 & 500 — jam di idle pill ditambah `font-medium` agar tidak terjadi *faux-bold* yang buram
- `italic` dipasang di semua baris lirik (bukan hanya yang aktif) supaya tidak ada pergeseran layout saat lirik berganti
- Simbol `♪` pada lirik pertama mungkin render dengan font sistem karena di luar subset Latin Google Fonts

---

### [v0.2.0] — 2026-10-19

#### 🎵 Integrasi Media Real-Time (Windows GSMTC) + Auto-Fetch Lirik

Perubahan terbesar sejak versi awal. ryflow sekarang membaca dan mengontrol media yang sedang diputar secara real-time dari sistem Windows, serta mengambil lirik secara otomatis dari internet.

---

#### `electron/media-bridge.ps1` — File Baru

Script PowerShell yang berjalan sebagai child process di background Electron. Bertugas sebagai jembatan antara Windows GSMTC dan UI ryflow.

**Cara kerja:**
- Polling data media dari GSMTC setiap ~800ms (judul, artis, status play/pause, posisi, durasi)
- Interpolasi posisi lagu secara akurat berdasarkan `LastUpdatedTime` agar progress bar tidak lag
- Cover art di-encode Base64 dan di-cache per lagu (tidak re-fetch setiap tick)
- Menerima perintah dari stdin: `playpause`, `next`, `prev`, `seek:<detik>`

---

#### `electron/main.cjs` — Modified

| Perubahan | Detail |
|---|---|
| `startMediaBridge()` | Spawn `media-bridge.ps1` sebagai child process PowerShell |
| Pipe stdout → readline | Baca JSON line-by-line, forward ke renderer via IPC `media-update` |
| `ipcMain.on('media-control')` | Terima aksi dari UI, tulis ke stdin PowerShell |
| `app.on('will-quit')` | Kill proses PowerShell saat Electron ditutup |

---

#### `electron/preload.cjs` — Modified

Dua API baru ditambahkan ke `window.electronAPI`:

| API | Fungsi |
|---|---|
| `onMediaUpdate(callback)` | Subscribe update media real-time, return cleanup function |
| `sendMediaControl(action)` | Kirim perintah kontrol ke PowerShell |

---

#### `src/App.jsx` — Refactor Besar

**State & Logic:**

| Sebelum | Sesudah |
|---|---|
| `isPlaying` boolean dummy | `media` object dari GSMTC (title, artist, isPlaying, position, duration, thumbnail) |
| `currentTime` auto-increment tiap 1 detik | Interpolasi lokal tiap 300ms (lebih mulus) + smoothing agar tidak loncat saat update tiba |
| `duration = 24` hardcoded | `media.duration` dari GSMTC |
| Lirik dummy statis | Fetch otomatis dari lrclib.net (synced LRC → plain → not found) |
| Jam & tanggal hardcoded | `now` state, update tiap 1 detik |

**Fungsi baru:**

| Fungsi | Keterangan |
|---|---|
| `parseLrc(lrcText)` | Parser format LRC `[mm:ss.xx]` → array `{time, text}` |
| `cleanTrackTitle(title)` | Strip suffix `(Remastered)`, `- Live Version`, dll. agar pencarian lirik lebih akurat |
| `fetchTrackExtras()` | Fetch iTunes (cover art HD) + lrclib.net (lirik), dengan AbortController untuk cleanup |
| `triggerControl(action)` | Wrapper `sendMediaControl` |
| `handleSeek(e)` | Klik progress bar → hitung posisi → kirim `seek:<detik>` |

**Fetch lirik — strategi dua langkah:**
1. `lrclib.net/api/get` (exact match) → fallback `lrclib.net/api/search` (fuzzy)
2. Priority: `syncedLyrics` → `plainLyrics` → `not_found`
3. iTunes API dipakai untuk cover art HD sebagai fallback jika GSMTC tidak punya thumbnail

**Perubahan layout:**

| Area | Sebelum | Sesudah |
|---|---|---|
| Grid | 7 kol kiri / 5 kol kanan | 5 kol kiri / 7 kol kanan (lirik lebih lega) |
| Progress bar | Gradient rose→amber, fixed height | Monokrom putih, `h-1` hover `h-1.5`, klik untuk seek |
| Panel lirik | Semua baris di-map dengan scale/blur | 3 baris: prev (redup) / current (terang) / next (redup), AnimatePresence popLayout |
| Idle pill cover | Lingkaran spinner hardcoded | Cover art dari GSMTC/iTunes, fallback dot indikator |
| Idle pill jam | Hardcoded `19:25` | Real-time dari state `now` |
| Waveform bar | `bg-rose-400` | `bg-white/75` (monokrom, konsisten) |
| Tombol kontrol | Dummy `setState`, `size={17}`, `w-8 h-8` | Real GSMTC control, `size={16}`, `w-7 h-7` |

---

### [v0.2.1] — 2026-10-19

#### 🎨 Vinyl Effect pada Idle Pill + Label Lirik

**Idle pill — cover art vinyl effect:**
- Cover art di idle pill sekarang berbentuk `rounded-full` (bulat penuh)
- Berputar pelan (8 detik/rotasi) saat lagu diputar — efek seperti piringan vinyl
- Diam di tempat saat pause, tidak snap balik ke posisi awal
- Fallback tanpa cover (dot indicator) juga mengikuti efek yang sama

**Header expanded — label lirik:**
- Label kondisional `'Synced' : 'Lyrics'` → selalu menampilkan `Lyrics`
- Dot indikator tetap menyala terang saat lirik ter-sync, redup jika tidak

**File yang diubah:** `src/App.jsx`

---

### [v0.2.2] — 2026-10-19

#### ✏️ Rename: `ryflow` → `Ryflow` di header expanded

Nama app di header expanded (saat notch dibuka) diubah dari `ryflow` menjadi `Ryflow`.

**Alasan:** Huruf kapital di awal membantu mata mengenalinya sebagai nama proper di tengah elemen UI lain yang juga kecil. Lowercase terasa tenggelam dan tidak punya identitas.

**File yang diubah:** `src/App.jsx` baris 317

---

### [v0.3.0] — 2026-10-19

#### 🚀 Standalone App (Tanpa Localhost), Auto-Start Boot, & System Tray

Aplikasi kini dapat di-compile menjadi installer `.exe` mandiri yang berjalan otomatis saat laptop dinyalakan tanpa perlu membuka terminal atau menjalankan server Vite localhost.

**Fitur & Peningkatan Utama:**
1. **Mode Offline / Standalone (`loadFile`):**
   - Mendeteksi `app.isPackaged`.
   - Di mode development tetap membuka `http://localhost:5173`.
   - Di mode produksi langsung membaca bundle statis `dist/index.html` via `loadFile()`.
2. **Auto-Start on Boot:**
   - Menggunakan `app.setLoginItemSettings({ openAtLogin: true })` saat aplikasi berstatus packaged, sehingga Ryflow otomatis berjalan di background saat Windows menyala.
3. **Single Instance Lock:**
   - Mencegah aplikasi terbuka dua kali. Jika shortcut diklik lagi saat aplikasi sudah berjalan, jendela Ryflow yang aktif langsung difokuskan.
4. **System Tray Menu:**
   - Menambahkan ikon tray di pojok kanan bawah Windows (dekat jam) dengan menu: status aktif, fokus/tampilkan, reload, dan opsi keluar (*quit*).
5. **Jalur Temp untuk Perintah Kontrol:**
   - `$cmdFile` dan `cmdFilePath` dipindahkan ke folder temp Windows (`app.getPath('temp')`) agar aman dari pembatasan hak akses read-only pada asar paket aplikasi.
6. **Packaging NSIS (`electron-builder`):**
   - Script `npm run electron:build` untuk mengemas seluruh aplikasi ke folder `release/` menjadi installer `.exe` siap pakai.

**File yang diubah:**
- `electron/main.cjs`
- `electron/media-bridge.ps1`
- `package.json`
- `.gitignore`
- `electron/tray.png` (new)

---

---

### [v0.3.1] — 2026-10-20

#### 💻 MacBook Notch Silhouette + Instant Top-Bezel Trigger & Monochrome Polish

Transformasi bentuk visual Ryflow dari kapsul melayang (*Dynamic Island*) menjadi siluet *Notch* ala MacBook yang menyatu dengan bingkai atas layar, dilengkapi solusi anti-senggol saat mengklik tab browser di belakangnya.

**Perubahan Bentuk & Visual (MacBook Notch & Clean Monochrome):**

| Area | Sebelum | Sesudah |
|---|---|---|
| Siluet Atas Notch | Melengkung di semua sudut (`borderRadius: 24`) seperti kapsul | Rata di bagian atas (`borderTopRadius: 0`, `border-t-0`), menyatu rapat dengan bezel layar |
| Bahu Kiri & Kanan Atas | Sudut siku/melengkung ke dalam | Ditambah 2 elemen SVG *Liquid Top Ears* (`12x12px`) yang melengkung cekung keluar ala MacBook |
| Dimensi Notch | Idle: `170x36px` / Expanded: `580x195px` | Idle: `172x34px` (radius bawah `14px`) / Expanded: `580x188px` (radius bawah `22px`) |
| Latar & Elemen Dekoratif | Ada *ambient glow* merah (`bg-rose-600 blur-3xl`) & ikon `Flame` | Dihapus sepenuhnya; diganti estetika *clean monochrome* dengan dot indikator minimalis |
| Tipografi Lirik | `font-lyric italic` (Fraunces) — terasa terlalu dekoratif dan sempit di ukuran kecil | `font-sans` (Plus Jakarta Sans) tegak — lebih tegas, bersih, dan mudah dibaca cepat |

**Mekanisme Interaksi Baru (Instant Top-Bezel Trigger):**
- **Masalah sebelumnya:** Posisi *idle notch* di tengah atas layar sering beririsan dengan deretan tab browser (seperti Chrome), sehingga niat mengklik atau menutup (`X`) tab malah tidak sengaja membuka Ryflow.
- **Solusi (`handleMouseMove` + `e.clientY <= 6`):**
  - Event pembuka diubah dari `onMouseEnter` menjadi `onMouseMove` dengan pengecekan koordinat vertikal kursor.
  - Saat kondisi *idle*, seluruh badan notch di area `Y > 6px` tetap berada dalam mode *click-through* (`setIgnoreMouseEvents(true, { forward: true })`), sehingga klik mouse langsung menembus ke tab Chrome di belakangnya.
  - Ryflow baru akan membuka secara **instan (tanpa delay)** ketika kursor didorong mentok menyentuh bibir paling atas layar (`Y <= 6px`).

**File yang diubah:** `src/App.jsx`

---

### [v0.3.2] — 2026-10-20

#### 🎵 YouTube Lyrics & Metadata Support + Fallback 3 Tingkat

Pembaruan pada sistem deteksi dan parsing metadata lagu untuk mendukung pemutaran dari YouTube di browser (Chrome/Edge) agar lirik dan cover art tetap dapat ditemukan dan ditampilkan.

**Fitur & Peningkatan Utama:**
1. **YouTube Video Title Parser (`parseYouTubeTitle`):**
   - Mendeteksi format `Artis - Judul` khas video YouTube.
   - Membersihkan suffix video YouTube: `(Official Video)`, `(Lyrics)`, `[MV]`, `(Visualizer)`, `(Audio)`, dsb.
   - Membersihkan nama channel VEVO/Topic/Official (mis. `ColdplayVEVO` → `Coldplay`).
2. **Sistem Fallback Lirik 3 Tingkat (`fetchTrackExtras`):**
   - **Tingkat 1:** Query lrclib menggunakan metadata hasil parsing YouTube.
   - **Tingkat 2:** Fallback ke metadata original jika belum ditemukan.
   - **Tingkat 3:** Fallback pencarian hanya dari judul lagu tanpa nama artis.
3. **Optimasi Cover & Anti-Flicker:**
   - Mempertahankan thumbnail sebelumnya saat transisi lagu agar piringan tidak berkedip hijau.
   - Memperbaiki query pencarian artwork iTunes.

**File yang diubah:**
- `src/App.jsx`
- `package.json`

---

### [v0.3.3] — 2026-10-22

#### 🎯 Validasi Ketat Pencarian Lirik (`pickBestMatch`) & Anti-Stuck Loading State

Pembaruan penanganan pengambilan lirik pada API lrclib untuk meningkatkan akurasi hasil pencarian dan mencegah tampilan macet (*stuck*) saat pergantian lagu.

**Fitur & Peningkatan Utama:**
1. **Validasi Kecocokan Lirik (`pickBestMatch`, `normKey`, `titleKey`):**
   - **Masalah sebelumnya:** Pencarian fallback `/api/search` hanya mengambil entri pertama yang memiliki lirik tanpa memvalidasi artis, berisiko menampilkan lirik dari lagu artis lain yang kebetulan memiliki judul yang sama (*false positive*).
   - **Solusi:** Menambahkan fungsi skoring `pickBestMatch` dengan normalisasi teks (menghapus aksen, simbol, kurung varian). Hasil search wajib cocok dengan judul lagu dan salah satu petunjuk artis (`hints`), memprioritaskan lirik tersinkronisasi (*syncedLyrics*).
2. **Parameter Pencarian Terstruktur (`track_name` & `artist_name`):**
   - Mengubah query pencarian lrclib dari pencarian umum `?q=judul+artis` menjadi parameter terstruktur `?track_name=...&artist_name=...` yang jauh lebih spesifik dan akurat di sisi server.
3. **Pelepasan Kunci Abort / Anti-Stuck Loading:**
   - **Masalah sebelumnya:** Jika proses fetch terpotong di tengah jalan (misal lagu di-skip cepat atau metadata sempat berkedip menjadi `"Tidak ada judul"`), ref `lastFetchedTrack` tetap menyimpan kunci lagu tersebut sehingga lagu tidak akan pernah di-fetch ulang, menyebabkan teks *"Memuat lirik..."* tersangkut selamanya.
   - **Solusi:** Menambahkan flag pelacak `finished` pada cleanup `useEffect`. Jika request dibatalkan sebelum selesai (`controller.signal.aborted`), kunci `lastFetchedTrack.current` di-reset kembali ke string kosong agar lagu dapat di-fetch ulang secara bersih.

**File yang diubah:**
- `src/App.jsx`
- `package.json`

---

### [v0.3.4] — 2026-10-22

#### 🎬 Restore Bounce Feel pada Animasi Notch

Mengembalikan rasa "hidup" pada animasi buka/tutup notch yang sebelumnya hilang akibat refactor ke sistem `absolute` positioning.

**Latar Belakang:**
Versi sebelumnya menggunakan `flex justify-between` pada konten anak di dalam spring container. Akibatnya saat notch menutup, spring overshoot (pantul ke bawah) menyebabkan konten header terjepit dan kemudian "melompat" ke posisi idle — bug visual yang mengganggu. Fix-nya (ubah ke `absolute` + fixed dimension) berhasil menghilangkan bug squish, namun mengorbankan rasa bounce karena konten tidak lagi bergerak bersama spring container.

**Perubahan:**

| Komponen | Sebelum | Sesudah |
|---|---|---|
| Parent spring `stiffness` | `420` | `380` |
| Parent spring `damping` | `32` | `24` (lebih bouncy) |
| `idle-view` entry | `opacity` + `scale 0.95→1` linear | `opacity` + `y: -8→0` spring (`stiffness: 360, damping: 22`) |
| `idle-view` exit | `opacity` + `scale 0.95` | `opacity` + `y: -4` |

**Cara kerjanya:**
- Container mengecil dengan pantul yang lebih terasa (`damping: 24`)
- Idle pill muncul dengan gerak spring kecil dari atas (`y: -8 → 0`) yang sedikit overshoot, memberi ilusi pill "jatuh dan mengeset" ke posisinya bersama container — tanpa ada konten yang terjepit

**File yang diubah:**
- `src/App.jsx`
- `package.json`

---

### [v0.4.0] — 2026-10-22

#### 🗓️ Multi-Tab Hub Navigation, Pin Mode & Tab Today (Cuaca, Kalender, Agenda)

Transformasi Ryflow dari sekadar pengontrol musik menjadi *smart productivity hub* di atas layar dengan sistem navigasi *micro-tabs*, fitur pengunci *notch* (*Pin Mode*), serta dasbor harian lengkap di tab `Today`.

**1. Navigasi Micro-Tabs & Pin Mode di Header:**

| Fitur | Detail Implementasi |
|---|---|
| **Micro Pill-Tabs (`Music` \| `Today` \| `AI`)** | Pemilih tab di bagian tengah header menggunakan animasi *sliding pill* monokrom (`layoutId="activeTabPill"`) untuk berpindah tampilan tanpa mengubah lebar notch |
| **Pin Mode (`isPinned`)** | Tombol ikon sematan (`Pin`) di sebelah nama `Ryflow` untuk mengunci notch agar tetap terbuka meskipun kursor meninggalkan area atas layar |
| **Auto-Hold saat Mengetik (`isInputFocused`)** | Menahan notch agar tidak menutup otomatis atau berubah menjadi *click-through* ketika pengguna sedang fokus mengetik di kolom input |
| **Dimensi Expanded** | Tinggi notch saat terbuka disesuaikan menjadi `580x196px` untuk memberi ruang proporsional bagi konten multi-tab |

**2. Fitur Baru pada Tab `Today`:**
- **Cuaca Real-Time Otomatis (`fetchWeather` & `getWeatherInfo`):**
  - Mendeteksi koordinat dan nama kota secara otomatis berdasarkan IP (`get.geojs.io`) dengan *fallback* ke Bandar Lampung (`-5.4292, 105.261`), lalu memperbarui data setiap 15 menit.
  - Mengambil suhu (`temperature_2m`), kelembapan (`relative_humidity_2m`), dan kondisi cuaca (`weather_code`) melalui **Open-Meteo API** tanpa memerlukan API key.
  - Mengonversi kode cuaca WMO menjadi label bahasa Indonesia (`Cerah`, `Berawan`, `Berkabut`, `Hujan`, `Badai Petir`) beserta ikon visual yang sesuai.
- **Kalender Mingguan (`getWeekDays`):**
  - Menampilkan deretan 7 hari dalam minggu berjalan (`Sen` s/d `Min`) lengkap dengan tanggal dan sorotan warna putih tegas pada hari ini (`isToday`).
- **Agenda / Quick To-Do List (`localStorage`):**
  - Pencatat agenda cepat dengan fitur tambah tugas (`Enter`), centang selesai (`toggleTodo`), hapus tugas (`deleteTodo`), serta penghitung progres penyelesaian (`selesai`).
  - Seluruh data agenda disimpan secara persisten di `localStorage` (`ryflow_todos`) agar tidak hilang saat aplikasi ditutup atau laptop dimatikan.

**3. Persiapan Tab `AI`:**
- Menambahkan tampilan *placeholder* untuk **Ryflow AI Agent** pada tab `AI` sebelum diintegrasikan dengan API Key pada tahap berikutnya.

**File yang diubah:** `src/App.jsx`

---

### [v0.5.0] — 2026-10-23

#### 🤖 Multi-Provider AI Agent, Akurasi Geolokasi Nominatim & Directional Tab Transition

Mengaktifkan fitur **Ryflow AI Agent** secara penuh di tab `AI` dengan dukungan berbagai *provider* populer, memperbaiki akurasi deteksi kota pada cuaca di tab `Today`, serta memoles transisi perpindahan antar-tab agar terasa lebih natural.

**1. Tab `AI` — Multi-Provider AI Agent & Validasi API Key Fleksibel:**
- **Auto-Detect Provider dari Prefix Key (`detectAiProvider`):**
  - **Google Gemini:** Mendukung prefix `AQ...` maupun `AIza...`
  - **Grok (xAI):** Mendukung prefix `grok_...` dan `xai-...` (dengan *fallback* otomatis ke endpoint Groq)
  - **Groq:** Mendukung prefix `gsk_...` (`llama-3.3-70b-versatile`)
  - **Anthropic Claude:** Mendukung prefix `sk-ant-...` (`claude-3-5-haiku-latest` dilengkapi header akses *renderer*)
  - **OpenAI:** Mendukung prefix `sk-...` (`gpt-4o-mini`)
- **Validasi API Key Longgar (`validateApiKey`):**
  - Menghapus pembatasan regex kaku yang sebelumnya menolak format key baru; kini cukup memvalidasi bahwa key tidak kosong, tanpa spasi, dan memiliki panjang minimal yang wajar ($\ge 10$ karakter).
- **Whitelist & Auto-Fallback Model Gemini (`GEMINI_MODELS`):**
  - Mendukung `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-1.5-pro`, dan `gemini-3.0-flash`.
  - Pengguna dapat mengklik *badge* nama model di tab `AI` untuk mengganti model Gemini secara langsung (`cycleGeminiModel`), serta sistem otomatis melakukan *fallback* ke model berikutnya jika suatu model tidak tersedia pada akun pengguna.
- **Konteks Real-Time & Quick Prompt Chips:**
  - AI Agent mengenali konteks lagu yang sedang diputar di Windows GSMTC, suhu cuaca kota saat ini, serta daftar agenda yang belum selesai.
  - Dilengkapi tombol cepat `🎵 Makna lagu ini` dan `⚡ Fokus hari ini`, fitur salin jawaban (`Copy`), *reset* percakapan, serta pesan *error* HTTP (`401`, `429`, `500`, dan koneksi terputus) yang ramah pengguna.

**2. Akurasi Cuaca & Lokasi (`fetchWeather`):**
- **Sumber Lokasi Bertingkat:** Menggunakan **Browser Geolocation API** (`navigator.geolocation.getCurrentPosition`) berbasis GPS/Wi-Fi sebagai sumber koordinat utama, dengan *fallback* ke IP geolocation (`geojs.io`) dan *hardcoded fallback* Bandar Lampung.
- **Reverse Geocoding Nominatim OpenStreetMap:** Mengambil nama kota/kabupaten yang akurat berdasarkan titik koordinat melalui endpoint `nominatim.openstreetmap.org/reverse` (`address.city || address.town || address.county`).

**3. Directional Tab Transition (`tabContentVariants`):**
- Mengganti transisi tab vertikal yang seragam dengan animasi geser berbasis arah (*directional slide* `x: ±18` mengikuti urutan `['music', 'today', 'ai']`), dikombinasikan dengan *subtle scale* (`0.97` → `1`) dan kurva *cubic-bezier* `[0.25, 0.46, 0.45, 0.94]`.

**4. Perbaikan Minor Pencarian Cover Art:**
- Memperbaiki spasi pemisah antara `${searchTitle} ${searchArtist}` pada URL pencarian *fallback cover art* iTunes API.

**File yang diubah:**
- `src/App.jsx`
- `package.json`

---

### [v0.5.1] — 2026-10-23

#### 🔄 Dynamic Gemini Model Auto-Discovery (`ListModels` API) & Auto-Sync Badge

Perbaikan permanen untuk mengatasi error `404 Not Found` dan pembatasan model pada Google Gemini API (`v1beta`) dengan mengganti daftar model statis menjadi deteksi model aktif secara dinamis dari server Google.

**Latar Belakang Masalah:**
- Beberapa nama model yang di-*hardcode* sebelumnya mengalami kendala di endpoint `v1beta`: `gemini-1.5-flash` dan `gemini-1.5-pro` telah dihentikan (*retired*), `gemini-2.5-flash` dibatasi untuk akun baru, sedangkan penamaan Gemini 3 Flash di API menggunakan ID `gemini-3-flash-preview` (bukan `gemini-3.0-flash`).
- Ketika semua model di dalam antrean *fallback* statis ditolak oleh server, fungsi `callAiAgent()` melempar pesan error dari model urutan terakhir (`lastError`), sehingga nama model pada pesan error tidak sesuai dengan *badge* model yang sedang dipilih di UI.

**Solusi & Perubahan Teknis:**

| Komponen / Fungsi | Detail Implementasi |
|---|---|
| **`fetchAvailableGeminiModels(cleanKey)`** | Memanggil endpoint resmi `GET /v1beta/models` milik Google untuk mengambil daftar model Gemini yang benar-benar aktif dan mendukung metode `generateContent` pada API Key pengguna |
| **Filter & Prioritas Skor Model** | Menyaring model khusus non-teks (`embedding`, `imagen`, `veo`, `tts`, `audio`) dan mengurutkan prioritas tertinggi pada varian Flash terbaru (`gemini-3-flash-preview`, `gemini-flash-latest`, `gemini-2.5-flash-lite`) |
| **Caching Daftar Model** | Menyimpan hasil *discovery* di memori (`cachedDiscoveredModels`) per API Key agar tidak melakukan request berulang setiap kali mengirim pesan |
| **Auto-Sync UI Badge (`usedModel`)** | Mengembalikan properti `usedModel` dan `availableModels` dari `callAiAgent()` sehingga *badge* pemilih model di tab `AI` dan `localStorage` (`ryflow_gemini_model`) otomatis terkunci ke model yang terbukti berhasil menjawab |

**File yang diubah:**
- `src/App.jsx`
- `package.json`

---

### [v0.5.2] — 2026-10-24

#### 🕒 Penambahan Konteks Waktu Nyata, Kelembapan Cuaca, dan Penyempurnaan System Prompt AI Agent

Memperkaya konteks sistem dan waktu nyata pada **Ryflow AI Agent** di tab `AI` agar asisten dapat mengenali hari, tanggal lengkap, jam aktif (WIB), serta rincian cuaca dan kelembapan terkini saat menjawab pertanyaan Ryper.

**Latar Belakang & Kebutuhan:**
- Sebelumnya, prompt sistem hanya menyertakan konteks musik, cuaca dasar (kota & suhu), dan agenda tertunda tanpa informasi hari, tanggal, jam, maupun persentase kelembapan.
- Akibatnya, ketika pengguna menanyakan waktu atau membutuhkan saran kontekstual berbasis waktu/momen hari ini, AI belum memiliki referensi waktu lokal secara langsung.

**Solusi & Perubahan Teknis:**

| Komponen / Variabel | Detail Implementasi |
|---|---|
| **`fullDateString`** | Memformat objek `Date` ke penanggalan lokal bahasa Indonesia (`id-ID`) lengkap dengan nama hari, tanggal, bulan, dan tahun (contoh: *Sabtu, 24 Oktober 2026*) |
| **`fullTimeString`** | Memformat jam dan menit format 24 jam (`en-GB`, contoh: *19:45*) berzona waktu WIB |
| **Penyempurnaan `systemPrompt`** | Mengintegrasikan tanggal lengkap, jam WIB, lokasi & cuaca (suhu, label cuaca, kelembapan `${weather.humidity}%`), lagu yang sedang diputar, serta agenda belum selesai ke dalam konteks sistem AI |

**File yang diubah:**
- `src/App.jsx`
- `package.json`
- `docs/CHANGES.md`

---

### [v0.5.3] — 2026-10-27

#### 🎨 Normalisasi Tailwind CSS v4 Canonical Classes & Pembersihan Linter

Membersihkan seluruh 46 notifikasi di panel *Problems* IDE yang berasal dari rekomendasi *canonical classes* ekstensi **Tailwind CSS IntelliSense** (`suggestCanonicalClasses`), serta membersihkan *unused import* pada linter.

**Latar Belakang:**
- Pada Tailwind CSS v4, penggunaan sintaks *arbitrary value* (seperti `/[0.08]`, `[12px]`, `[68px]`) disarankan untuk ditulis menggunakan skala kanonikal resmi Tailwind agar class lebih ringkas, konsisten, dan mudah dipelihara.
- Sebanyak 46 peringatan muncul di tab *Problems* pada `src/App.jsx`.

**Perubahan Teknis & Normalisasi Class:**

| Kategori | Sintaks Sebelumnya | Sintaks Kanonikal (Baru) | Contoh di `App.jsx` |
|---|---|---|---|
| **Opasitas Warna** | `/[0.03]`, `/[0.04]`, `/[0.05]`, `/[0.06]`, `/[0.08]`, `/[0.09]` | `/3`, `/4`, `/5`, `/6`, `/8`, `/9` | `border-white/8`, `bg-white/5`, `hover:bg-white/6`, `hover:bg-white/9` |
| **Dimensi Statis** | `w-[12px] h-[12px]`, `w-[2px]`, `gap-[2px]` | `w-3 h-3`, `w-0.5`, `gap-0.5` | Bahu telinga notch (SVG ears) & waveform audio idle |
| **Dimensi Notch** | `w-[172px] h-[34px]`, `w-[580px] h-[196px]` | `w-43 h-8.5`, `w-145 h-49` | Ukuran idle pill & expanded container |
| **Batas Maksimal** | `max-w-[135px]`, `max-h-[68px]` | `max-w-33.75`, `max-h-17` | Kota cuaca & container scroll agenda/AI response |
| **Radius Sudut** | `rounded-[4px]` | `rounded-sm` | Checkbox todo list agenda hari ini |

**Pembersihan Import:**
- Menghapus import `Sparkles` dari `lucide-react` di header `src/App.jsx` yang tidak digunakan (*unused import*), mengurangi peringatan linter `oxlint`.

**Verifikasi:**
- Panel *Problems* IDE bersih dari 46 notifikasi `suggestCanonicalClasses`.
- `npm run build` dan `npm run lint` terverifikasi sukses tanpa error.

**File yang diubah:**
- `src/App.jsx`
- `package.json`
- `docs/CHANGES.md`

---

*Tambahkan entri baru di atas bagian ini saat ada perubahan berikutnya.*

