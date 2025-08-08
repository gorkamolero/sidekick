import { app, BrowserWindow, ipcMain, nativeImage } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 400,
    height: 800,
    x: 0,
    y: 0,
    alwaysOnTop: true,
    frame: true,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools({ mode: 'detach' });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle native file drag for external applications (DAW drag and drop)
ipcMain.on('ondragstart', (event, filePath: string) => {
  console.log('🎵 Native drag started for file:', filePath);
  
  // Ensure we have an absolute path
  const absolutePath = path.isAbsolute(filePath) 
    ? filePath 
    : path.resolve(filePath);
  
  // Verify file exists
  if (!require('fs').existsSync(absolutePath)) {
    console.error('❌ File not found for drag:', absolutePath);
    return;
  }
  
  // Simple icon creation that was working
  const size = 32;
  const buffer = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size * 4; i += 4) {
    buffer[i] = 138;     // R (purple)
    buffer[i + 1] = 43;   // G
    buffer[i + 2] = 226;  // B
    buffer[i + 3] = 255;  // A
  }
  const icon = nativeImage.createFromBuffer(buffer, {
    width: size,
    height: size
  });
  
  // Start the native drag operation
  try {
    event.sender.startDrag({
      file: absolutePath,
      icon: icon
    });
    console.log('✅ Native drag initiated for:', absolutePath);
  } catch (error) {
    console.error('❌ Failed to start drag:', error);
  }
});
