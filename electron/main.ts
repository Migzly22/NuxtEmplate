import { app, BrowserWindow, } from 'electron';
import Bootstrap from './utils/Bootstrap';
import ipcHandlers from "./ipc";


const isProd =  app.isPackaged
const pathLocation = isProd ? process.resourcesPath : process.cwd()
let mainWindow: BrowserWindow | null = null

const bootstrap = new Bootstrap({
  isProd,
  pathLocation,
  nitroPort : 3000,
  initPath : process.platform === "win32" ?  app.getPath('userData') : process.resourcesPath,
})

// Set application name for Windows 10+ notifications
if (process.platform === 'win32')
  app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}


const createWindow = async () => {
  const nitroPort = bootstrap.getNitroPort()
  const preloadPath = bootstrap.getPreloadPath()

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,   
    minHeight: 600,  
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: true,
      contextIsolation: true,
      sandbox: false,
    },
  });

  // Load your Nuxt app
  // if(isProd) {
  //   const prodPath = join(pathLocation,'app.asar','.output', 'public','index.html') 
  //   mainWindow.loadFile(prodPath)
  // }else {
    const url =`http://localhost:${nitroPort}`;
    mainWindow.loadURL(url);
  // }


  // Keyboard shortcut to toggle DevTools
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      mainWindow?.webContents.toggleDevTools();
    }
  });

  // Check if preload was loaded
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.executeJavaScript('console.log("Window electron API:", window.biometric);');
  });

};

app.whenReady().then(async() => {
  await bootstrap.init()
  createWindow();
});

app.on('window-all-closed', () => {
  bootstrap.stopWebServer().then(() => app.quit());
});

ipcHandlers()
