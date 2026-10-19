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

### [v0.3.1] — 2026-10-19

#### 🎯 UX & Layout Upgrade: MacBook Notch + Top-Bezel Trigger (Tanpa Delay)

Pembaruan besar pada interaksi kursor (hover) dan geometri notch agar selaras dengan estetika perangkat keras laptop dan fungsionalitas browser Windows.

---

#### 1. Geometri Notch: Gaya MacBook (*MacBook Notch Style*)

- **Rata di Atas (`border-top-radius: 0`):** Sisi paling atas notch dibuat rata dan menempel rapat di bibir atas layar ($Y = 0$), menciptakan ilusi visual seolah-olah notch tumbuh langsung dari bingkai (bezel) fisik monitor.
- **Lekukan Bahu Kiri & Kanan (Top Ears):** Ditambahkan elemen lengkung SVG transparan di kedua sudut atas (12×12px) untuk membentuk siluet cekung halus khas layar MacBook.
- **Sudut Bawah Melengkung:** Sudut bawah notch tetap mempertahankan radius lengkung yang elegan saat tertutup (14px) maupun terbuka (22px).

---

#### 2. Mekanisme Interaksi: Top-Bezel Trigger

**Masalah sebelumnya:** Idle notch beririsan langsung dengan posisi tab Chrome di Windows (Y = 0 hingga 34px), sehingga kursor yang ingin mengklik tab Chrome sering tak sengaja memicu notch terbuka.

**Solusi (Top-Bezel Trigger):**

| Kondisi | Perilaku |
|---------|----------|
| Notch tertutup (idle) | Seluruh area notch tembus klik penuh (`setIgnoreMouseEvents`) |
| Kursor di `e.clientY <= 6` | Notch terbuka — zona trigger tepat di garis atas layar |
| Kursor di bawah 6px | Area bebas — tab Chrome & tombol X tidak terganggu |
| Respons | **Instan tanpa delay** — timer delay dihapus sepenuhnya |

---

**File yang diubah:**
- `src/App.jsx` — logika `handleMouseMove`, struktur animasi Framer Motion, dan penambahan elemen SVG Top Ears

---

*Tambahkan entri baru di atas bagian ini saat ada perubahan berikutnya.*
