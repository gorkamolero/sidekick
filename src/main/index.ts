import { app, BrowserWindow, ipcMain, nativeImage, screen } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { initializeAbletonLink, cleanupAbletonLink } from './services/abletonLink';
import { AbletonDetector } from './services/abletonDetector';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null;
let abletonDetector: AbletonDetector | null = null;

const createWindow = () => {
  // Get the primary display's work area (excludes menu bar and dock)
  const primaryDisplay = screen.getPrimaryDisplay();
  const { workAreaSize, bounds } = primaryDisplay;
  
  // Position window on the right side of the screen
  const windowWidth = 400;
  const xPosition = bounds.x + workAreaSize.width - windowWidth;
  
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: workAreaSize.height, // Full height of work area
    x: xPosition, // Right side of screen
    y: bounds.y,
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
  
  // Initialize Ableton Link
  initializeAbletonLink(mainWindow);
  
  // Start monitoring for Ableton Live
  abletonDetector = new AbletonDetector(mainWindow);
  abletonDetector.startMonitoring();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  cleanupAbletonLink();
  abletonDetector?.stopMonitoring();
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
ipcMain.on('ondragstart', (event, { filePath, imageData }: { filePath: string; imageData?: string }) => {
  console.log('🎵 Native drag started for file:', filePath, imageData ? 'with custom image' : '');
  
  // Ensure we have an absolute path
  const absolutePath = path.isAbsolute(filePath) 
    ? filePath 
    : path.resolve(filePath);
  
  // Verify file exists
  if (!require('fs').existsSync(absolutePath)) {
    console.error('❌ File not found for drag:', absolutePath);
    return;
  }
  
  // Create icon - either from provided image or default music note
  let icon: Electron.NativeImage;
  
  if (imageData) {
    // Use the custom image from the renderer
    icon = nativeImage.createFromDataURL(imageData);
  } else {
    // Fallback to simple purple square
    const size = 32;
    const buffer = Buffer.alloc(size * size * 4);
    for (let i = 0; i < size * size * 4; i += 4) {
      buffer[i] = 138;     // R (purple)
      buffer[i + 1] = 43;   // G
      buffer[i + 2] = 226;  // B
      buffer[i + 3] = 255;  // A
    }
    icon = nativeImage.createFromBuffer(buffer, {
      width: size,
      height: size
    });
  }
  
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

// Handle native file drag with custom image
ipcMain.on('ondragstart-with-image', (event, { filePath, imageData }: { filePath: string; imageData: string }) => {
  console.log('🎵 Native drag with custom image started for file:', filePath);
  
  // Ensure we have an absolute path
  const absolutePath = path.isAbsolute(filePath) 
    ? filePath 
    : path.resolve(filePath);
  
  // Verify file exists
  if (!require('fs').existsSync(absolutePath)) {
    console.error('❌ File not found for drag:', absolutePath);
    return;
  }
  
  // Create icon from the provided image data
  const icon = nativeImage.createFromDataURL(imageData);
  
  // Start the native drag operation with custom icon
  try {
    event.sender.startDrag({
      file: absolutePath,
      icon: icon
    });
    console.log('✅ Native drag with custom icon initiated for:', absolutePath);
  } catch (error) {
    console.error('❌ Failed to start drag:', error);
  }
});
