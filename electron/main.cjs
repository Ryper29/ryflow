const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

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

    // Memastikan notch selalu berada di lapisan paling atas
    mainWindow.setAlwaysOnTop(true, 'screen-saver');

    // Default: area transparan tembus klik, tapi tetap mendeteksi gerakan mouse
    mainWindow.setIgnoreMouseEvents(true, { forward: true });

    mainWindow.loadURL('http://localhost:5173');
}

ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        win.setIgnoreMouseEvents(ignore, options);
    }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});