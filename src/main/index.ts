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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
import './ipc';
import './mastra';

// Handle native file drag for external applications
ipcMain.on('ondragstart', (event, filePath: string) => {
  console.log('🎵 Native drag started for file:', filePath);
  
  // Create a proper icon for macOS (required - cannot be empty!)
  // Create a small 16x16 music note icon
  const iconBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAEZSURBVDiNpZOxSgNBEIa/2T07OZPcJWihjaWFlvoEPoBgY2Ej2FkJ2vgCPoGlrY2djYWlhYWIlSAIFsYgaDiTXHJ7O2thOHPJBRz4YZiZ/b6Z3ZlV/BN5lfqCpsM8MAcMAiVAAHvAGrBkjNkr5F+VAQDXB0aB98/hAfAI7BpjLooxFADUAPr6QE3k4+oCk4BzzrlJYOKrgKoOpKqj7WzU9zUA13XH2tk4HYjHXwXaRj4H7LcFVPVEVZdVdTyELqrqiqpeZMD9OKzGsiwBnuM4N57nHTvn3hNgHnhJ/CKw8R1g0xjzBFR838+FEAghqDdbrYdhGC00m83bdiAAy4SQDyE5BVaBlwLoAw6BKWA6+XpkQJJL/r3/iE9Yum6c9fMQiAAAAABJRU5ErkJggg==',
    'base64'
  );
  const icon = nativeImage.createFromBuffer(iconBuffer);
  
  event.sender.startDrag({
    file: filePath,
    icon: icon
  });
});
