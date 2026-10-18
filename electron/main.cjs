const { app, BrowserWindow, screen, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const readline = require('readline');

// Mencegah aplikasi dibuka dobel (Single Instance Lock)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
    process.exit(0);
}

let mainWindow;
let mediaProcess;
let tray = null;

// File perintah ditaruh di folder temp agar aman ditulis di mode produksi
const cmdFilePath = path.join(app.getPath('temp'), 'ryflow-media.cmd');

function getScriptPath() {
    if (app.isPackaged) {
        return path.join(__dirname, 'media-bridge.ps1').replace('app.asar', 'app.asar.unpacked');
    }
    return path.join(__dirname, 'media-bridge.ps1');
}

function startMediaBridge() {
    const scriptPath = getScriptPath();

    if (fs.existsSync(cmdFilePath)) {
        try { fs.unlinkSync(cmdFilePath); } catch { }
    }

    mediaProcess = spawn('powershell.exe', [
        '-NoProfile',
        '-NonInteractive',
        '-Sta',
        '-ExecutionPolicy', 'Bypass',
        '-File', scriptPath,
        '-cmdFilePath', cmdFilePath
    ]);

    const rl = readline.createInterface({ input: mediaProcess.stdout });

    rl.on('line', (line) => {
        const trimmed = line.trim();
        if (!trimmed.startsWith('{')) return;
        try {
            const data = JSON.parse(trimmed);
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('media-update', data);
            }
        } catch (err) {
            console.error('[MediaBridge Parse Error]:', err.message);
        }
    });

    mediaProcess.stderr.on('data', (data) => {
        console.error('[MediaBridge PS Error]:', data.toString());
    });

    mediaProcess.on('exit', () => {
        mediaProcess = null;
    });
}

function createWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth } = primaryDisplay.workAreaSize;

    const winWidth = 650;
    const winHeight = 260;

    mainWindow = new BrowserWindow({
        width: winWidth,
        height: winHeight,
        x: Math.round((screenWidth - winWidth) / 2),
        y: 0,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        hasShadow: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setIgnoreMouseEvents(true, { forward: true });

    // Jika mode dev: buka localhost. Jika mode produksi/standalone: baca file dist/index.html lokal
    if (!app.isPackaged) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

function createTray() {
    const iconPath = path.join(__dirname, 'tray.png');
    tray = new Tray(iconPath);
    tray.setToolTip('Ryflow Dynamic Island');

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Ryflow — Aktif', enabled: false },
        { type: 'separator' },
        {
            label: 'Tampilkan / Fokus',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        },
        {
            label: 'Muat Ulang (Reload)',
            click: () => {
                if (mainWindow) mainWindow.reload();
            }
        },
        { type: 'separator' },
        {
            label: 'Keluar dari Ryflow',
            click: () => {
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        win.setIgnoreMouseEvents(ignore, options);
    }
});

ipcMain.on('media-control', (_event, action) => {
    try {
        fs.writeFileSync(cmdFilePath, String(action), 'utf8');
    } catch (err) {
        console.error('[MediaBridge Cmd Error]:', err.message);
    }
});

app.on('second-instance', () => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
    }
});

app.whenReady().then(() => {
    createWindow();
    createTray();
    startMediaBridge();

    // Otomatis daftar ke Windows Startup saat laptop menyala (hanya aktif jika sudah di-build jadi aplikasi)
    if (app.isPackaged) {
        app.setLoginItemSettings({
            openAtLogin: true,
            path: process.execPath,
        });
    }
});

app.on('will-quit', () => {
    if (mediaProcess) {
        mediaProcess.kill();
    }
    if (fs.existsSync(cmdFilePath)) {
        try { fs.unlinkSync(cmdFilePath); } catch { }
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});