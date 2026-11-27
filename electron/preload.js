const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  saveFile: (buffer, defaultName) => ipcRenderer.invoke('save-file', { buffer, defaultName }),
  saveBufferDirect: (buffer, filePath) => ipcRenderer.invoke('save-buffer-direct', { buffer, filePath })
});
