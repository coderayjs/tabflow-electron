import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('electronAPI', {
    // Authentication
    login: (employeeNumber, password) => ipcRenderer.invoke('auth:login', employeeNumber, password),
    getCurrentUser: () => ipcRenderer.invoke('auth:getCurrentUser'),
    logout: () => ipcRenderer.invoke('auth:logout'),
    // Database operations will be added here
});
