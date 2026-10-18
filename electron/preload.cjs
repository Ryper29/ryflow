const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    setIgnoreMouseEvents: (ignore, options) => {
        ipcRenderer.send('set-ignore-mouse-events', ignore, options);
    },
    onMediaUpdate: (callback) => {
        const listener = (_event, data) => callback(data);
        ipcRenderer.on('media-update', listener);
        return () => ipcRenderer.removeListener('media-update', listener);
    },
    sendMediaControl: (action) => {
        ipcRenderer.send('media-control', action);
    }
});