# TableFlo - Electron Version

Modern, cross-platform casino dealer rotation management system built with React, TypeScript, and Electron.

## 🚀 Features

- ✅ Modern, beautiful UI with Tailwind CSS
- ✅ Cross-platform (Windows, macOS, Linux)
- ✅ React + TypeScript for type safety
- ✅ SQLite database with better-sqlite3
- ✅ Electron for native desktop experience
- ✅ Can be packaged as .exe installer

## 📦 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run in development mode:**
   ```bash
   npm run electron:dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Package as .exe (Windows):**
   ```bash
   npm run package:win
   ```

   This will create:
   - `dist-electron/TableFlo Setup 1.0.0.exe` - Installer
   - `dist-electron/win-unpacked/TableFlo.exe` - Standalone executable

## 🎯 Demo Credentials

```
Employee Number: ADMIN001
Password: admin123
```

## 🏗️ Project Structure

```
tableflo-electron/
├── electron/          # Electron main process
│   ├── main.ts       # Main process entry
│   └── preload.ts    # Preload script
├── src/
│   ├── components/   # React components
│   ├── models/       # TypeScript models
│   ├── enums/        # TypeScript enums
│   ├── services/     # Business logic services
│   ├── stores/       # Zustand state management
│   └── utils/         # Utilities (database, etc.)
└── package.json
```

## 🛠️ Development

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** Tailwind CSS
- **State:** Zustand
- **Database:** SQLite (better-sqlite3)
- **Desktop:** Electron

## 📝 Notes

- Database is stored in user data directory
- First run will seed demo data automatically
- All services are ported from the original C# WPF version

