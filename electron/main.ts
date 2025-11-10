import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let currentUser: any = null;
let db: any = null;
let authService: any = null;

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

app.whenReady().then(async () => {
  try {
    const dbModule = await import('../src/utils/database.js');
    const seedModule = await import('../src/utils/seedData.js');
    const authModule = await import('../src/services/AuthenticationService.js');
    
    db = dbModule;
    authService = new authModule.AuthenticationService();
    
    await dbModule.getDatabase();
    await seedModule.seedDatabase();
  } catch (error) {
    console.error('Init error:', error);
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

  // mainWindow.webContents.openDevTools();
  
  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    const indexPath = path.join(process.resourcesPath, 'app.asar', 'dist', 'index.html');
    console.log('Loading from:', indexPath);
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error('Failed to load from asar:', err);
      const fallbackPath = path.join(__dirname, '../../dist/index.html');
      console.log('Trying fallback:', fallbackPath);
      mainWindow.loadFile(fallbackPath);
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (db?.closeDatabase) db.closeDatabase();
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.handle('auth:login', async (_, employeeNumber: string, password: string) => {
  try {
    if (!authService) return { success: false, error: 'Auth not initialized' };
    const employee = await authService.authenticate(employeeNumber, password);
    if (employee) {
      currentUser = employee;
      return { success: true, employee };
    }
    return { success: false, error: 'Invalid credentials' };
  } catch (error: any) {
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

