const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
    login: (employeeNumber, password) => ipcRenderer.invoke('auth:login', employeeNumber, password),
    getCurrentUser: () => ipcRenderer.invoke('auth:getCurrentUser'),
    logout: () => ipcRenderer.invoke('auth:logout'),
});
