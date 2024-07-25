const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')
const Dev = require("./Dev")
const BuggyConnect = require("./BuggyConnect")
let mainWindow;
let buggyConnect;
let dev;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 600,
    resizable: false,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegrationInWorker: true,
      preload: path.join(__dirname, "src", "preload.js")
    }
  })

  buggyConnect = new BuggyConnect({ mainWindow })
  dev = new Dev({ buggyConnect })

  mainWindow.loadFile(path.join(__dirname, "src", "index.html"))
  mainWindow.on("ready-to-show", () => {
    mainWindow.show()
  })

}

app.setAppUserModelId("fr.hydix.e-motion")

app.whenReady().then(() => {
  createWindow();
  dev.createDevWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      dev.createDevWindow();
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})