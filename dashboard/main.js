const { app, BrowserWindow } = require('electron')
const path = require('node:path')

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 480,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
    //   preload: path.join(__dirname, 'preload.js')
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
        nodeIntegrationInWorker: true,
        preload: path.join(__dirname, "src", "preload.js")
    }
  })

  mainWindow.loadFile(path.join(__dirname, "src", "index.html"))
  mainWindow.on("ready-to-show", () => {
    mainWindow.show()
  })
  
}

app.setAppUserModelId("fr.hydix.e-motion")

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})