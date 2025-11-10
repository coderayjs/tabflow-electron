import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { getDatabase, closeDatabase } from '../src/utils/database.js';
import { seedDatabase } from '../src/utils/seedData.js';
import { AuthenticationService } from '../src/services/AuthenticationService.js';
let mainWindow = null;
let currentUser = null;
// Initialize database on app start
app.whenReady().then(async () => {
    // Initialize database
    await getDatabase();
    // Seed data on first run
    try {
        await seedDatabase();
    }
    catch (error) {
        console.error('Error seeding database:', error);
    }
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        icon: path.join(__dirname, '../build/icon.png'),
    });
    // Load the app
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        closeDatabase();
        app.quit();
    }
});
app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
// IPC Handlers
const authService = new AuthenticationService();
ipcMain.handle('auth:login', async (_, employeeNumber, password) => {
    try {
        const employee = await authService.authenticate(employeeNumber, password);
        if (employee) {
            currentUser = employee;
            return { success: true, employee };
        }
        return { success: false, error: 'Invalid credentials' };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
});
ipcMain.handle('auth:getCurrentUser', async () => {
    return currentUser;
});
ipcMain.handle('auth:logout', async () => {
    currentUser = null;
    return { success: true };
});
