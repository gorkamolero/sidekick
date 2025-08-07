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
  
  // Create a proper audio drag icon (32x32 recommended for better visibility)
  // This is a base64-encoded PNG of a music note icon
  const iconBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAKFSURBVFiFtZexaxRBFMa/N7O7d3t7l1wSL4mJRhEVRBsrC0EQLCwsxEIQBEHBykL/AEEsBAsLC0EsBBtBsBDEQhAsBLEQFAQVRUUxEiV6Se7udmfnzXtbiHu3c7cXQ+KDYXZ25vt+M2/evBkiIvxPGUutBIA9ALYDWAdgFYAygByADwDeAHgI4DaAm0T0o5UBa60FgGEAxwEcBFBqsXkOwGUAF4loIrmhKQBr7V4AFwBs+4P+5gCcJqKrC9akrrPWngJwGkC23Q4TZADglLX2dNIRAGCttUcAnEGL4BG5iTAF40dTCFOYgvHHkW3OOOdOABj+BcBasx/ABQCZuZLrbuC9h/feRfsJIfRc1zVa64WGAaC01jkA5wCMJQEOArjo0AK0dNGOWmsOAhARI2NHrLXnWvnQ58gN4P6vnt4qEZEQgrfU7JYxZhEAAGCtXQXgOYCV7aQqJJcwcOUCqq/u/wncwKbt2Pbofsr5LADnm+vWmv0Axn9FfvfyLayfO9Y1efPr1cJfAeBBFHUHQkgCMAwgGx8vfHzDlv2jGFg3hEGVQ7ZnObKqgIzMQAoBIQWYCR6BhIBDgK8/4YIaaoeG8eV1NJJdGKP9AE52O6uhmV0UrKhC+jUIgCLylCTvTYFCAOhJ/pzZRcFOQGjON9YvBGBdS+OuSaYRAHpdCUkATXr/LHQnzaBzJQxgGsAgOtdgM/kfaBJAo6SN0ARwhYguRXcVvD2AG9G9XaIzpwsB6Fw7ANzshgAAiGg8nHOzTsBvJnYVx0grbcOx1OoAgCfR/0gA57EY+B0S8LQqy+X+hLEsLQFYH00kPzrQxBMA94jobP3v8F0AIiJGNOsuRGu0VrJaaxezRHQG/1k/AcBTFMUBquHeAAAAAElFTkSuQmCC',
    'base64'
  );
  const icon = nativeImage.createFromBuffer(iconBuffer);
  
  // Start the native drag operation
  // This enables dragging to external applications like Ableton Live
  event.sender.startDrag({
    file: absolutePath,
    icon: icon.resize({ width: 32, height: 32 }) // Ensure proper size
  });
  
  console.log('✅ Native drag initiated for:', absolutePath);
});
