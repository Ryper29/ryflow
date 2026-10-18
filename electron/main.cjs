const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const readline = require('readline');

let mainWindow;
let mediaProcess;
const cmdFilePath = path.join(__dirname, '.media-cmd');

function startMediaBridge() {
    const scriptPath = path.join(__dirname, 'media-bridge.ps1');

    mediaProcess = spawn('powershell.exe', [
        '-NoProfile',
        '-NonInteractive',
        '-Sta',
        '-ExecutionPolicy', 'Bypass',
        '-File', scriptPath
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

    mainWindow.loadURL('http://localhost:5173');
}

ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        win.setIgnoreMouseEvents(ignore, options);
    }
});

// Mengirim perintah kontrol tombol ke media-bridge
ipcMain.on('media-control', (_event, action) => {
    try {
        fs.writeFileSync(cmdFilePath, String(action), 'utf8');
    } catch (err) {
        console.error('[MediaBridge Cmd Error]:', err.message);
    }
});

app.whenReady().then(() => {
    createWindow();
    startMediaBridge();
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