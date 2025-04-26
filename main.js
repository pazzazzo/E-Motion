const { app, BrowserWindow, ipcMain, session, components } = require('electron')
const fs = require('fs')
const path = require('node:path')
const Dev = require("./Dev")
const VehicleConnect = require("./VehicleConnect");
const { ipcRenderer } = require('electron');
const Proxy = require('./proxy');
let mainWindow;
let vehicleConnect;
let dev;
let proxy = new Proxy()


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

function pad(n) {
  return String(n).padStart(2, '0');
}
function formatDate(date, opts = { withYear: true, onlyMonth: false }) {
  const M = pad(date.getMonth() + 1);
  const D = pad(date.getDate());
  return opts.onlyMonth ? `${M}/${date.getFullYear()}` : opts.withYear ? `${M}/${D}/${date.getFullYear()}` : `${D}/${M}`;
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    // width: 1024,
    // height: 600,
    width: 1366,
    height: 768,
    resizable: false,
    autoHideMenuBar: true,
    show: false,
    icon: path.join(__dirname, "icon.png"),
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

app.setAppUserModelId("E-Motion")
app.setName("E-Motion")

app.whenReady().then(async () => {
  await components.whenReady();
  console.log('components ready:', components.status());
  await session.defaultSession.setProxy({
    proxyRules: proxy.rules
  })
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

let datagraph = JSON.parse(fs.readFileSync(path.join(__dirname, "src", "datagraph.json")).toString())
function saveDatagraph() {
  fs.writeFileSync(path.join(__dirname, "src", "datagraph.json"), JSON.stringify(datagraph))
}

ipcMain.on("dataTransfer.get", (event, cb) => {
  cb(proxy.getData())
})
ipcMain.on("dataStats.get", (event, cb) => {
  cb(proxy.stats)
})

proxy.on("use.update", (sent, received, stats) => {
  let statId = formatDate(new Date(), { withYear: true })
  let base = datagraph["data_use"][statId] || 0
  datagraph["data_use"][statId] = sent + received + base

  let monthStatId = formatDate(new Date(), { onlyMonth: true })
  let monthBase = datagraph["monthly_data_use"][monthStatId] || 0
  datagraph["monthly_data_use"][monthStatId] = sent + received + monthBase

  if (!mainWindow.webContents.isDestroyed()) {
    mainWindow.webContents.send("proxy.update", {
      total: (sent + received + base),
      monthly: (sent + received + monthBase),
      stats
    })
  }
  saveDatagraph()
})