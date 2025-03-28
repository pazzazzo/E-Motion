const { app, BrowserWindow, ipcMain, session, components } = require('electron')
const path = require('node:path')
const Dev = require("./Dev")
const VehicleConnect = require("./VehicleConnect")
let mainWindow;
let vehicleConnect;
let dev;

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('enable-native-gpu-memory-buffers');
app.commandLine.appendSwitch('disk-cache-size', '1024000000');

app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('max-gum-fps', '100');

// app.commandLine.appendSwitch('widevine-cdm-version', '4.10.2891.0')

// app.commandLine.appendSwitch('widevine-cdm-path', './libwidevinecdm.so')
// app.commandLine.appendSwitch('enable-widevine-cdm');

const createWindow = () => {
  mainWindow = new BrowserWindow({
    // width: 1024,
    // height: 600,
    width: 1366,
    height: 768,
    resizable: false,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegrationInWorker: true,
      webviewTag: true,
      preload: path.join(__dirname, "src", "preload.js"),
      plugins: true,
      experimentalFeatures: true,
      webgl: true,

    }
  })

  vehicleConnect = new VehicleConnect({ mainWindow })
  dev = new Dev({ vehicleConnect })

  mainWindow.loadFile(path.join(__dirname, "src", "index.html"))
  mainWindow.on("ready-to-show", () => {
    mainWindow.show()
  })

}

app.setAppUserModelId("fr.hydix.e-motion")

app.whenReady().then(async () => {
  await components.whenReady();
  console.log('components ready:', components.status());
  // session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
  //   if (details.requestHeaders["User-Agent"]) {
  //     details.requestHeaders["User-Agent"] = details.requestHeaders["User-Agent"].replace("Electron", "EMotionDashboard") 
  //   }

  //   // details.requestHeaders["User-Agent"] = "MonNavigateurElectron/1.0";
  //   callback({ cancel: false, requestHeaders: details.requestHeaders });
  // });
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