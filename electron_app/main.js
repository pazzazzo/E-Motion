const { app, BrowserWindow, ipcMain, session, globalShortcut, screen } = require('electron')
const fs = require('fs')
const path = require('node:path')
const Dev = require("./Dev")
const VehicleConnect = require("./VehicleConnect");
const { autoUpdater } = require('electron-updater');
const { spawn } = require('child_process');
const Proxy = require('./proxy');
let mainWindow;
let vehicleConnect;
let dev;
let libre;
let proxy = new Proxy()
const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const LocationServer = require('./LocationServer');

console.table(Object.entries(process.versions).map(([process, version]) => ({ process, version })));

let locationServer
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('enable-native-gpu-memory-buffers');
app.commandLine.appendSwitch('disk-cache-size', '1024000000');

// app.commandLine.appendSwitch('enable-features', 'GlobalShortcutsPortal')
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('max-gum-fps', '100');


const DB_PATH = path.join(__dirname, 'database');

function pad(n) {
  return String(n).padStart(2, '0');
}
function formatDate(date, opts = { withYear: true, onlyMonth: false }) {
  const M = pad(date.getMonth() + 1);
  const D = pad(date.getDate());
  return opts.onlyMonth ? `${M}/${date.getFullYear()}` : opts.withYear ? `${M}/${D}/${date.getFullYear()}` : `${D}/${M}`;
}

const createWindow = async () => {
  await i18next
    .use(Backend)
    .init({
      backend: {
        loadPath: path.join(__dirname, 'locales/{{lng}}.json')
      },
      lng: app.getLocale(),   // récupère la langue du système
      fallbackLng: 'en',
      interpolation: { escapeValue: false }
    });

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
  locationServer = new LocationServer()
  locationServer.on("update", (data) => {
    vehicleConnect.positonChange(data.longitude, data.latitude)
    if (data.direction) {
      vehicleConnect.headindChange(data.direction)
    }
  })
  if (fs.existsSync(DB_PATH) && !process.argv.includes("--welcome")) {
    mainWindow.loadFile(path.join(__dirname, "src", "index.html"))
    if (!vehicleConnect.checkVIN() || process.argv.includes("--unauthorized")) {
      mainWindow.loadFile(path.join(__dirname, "src", "unauthorized", "index.html"))
    }
  } else {
    // require("./disableAppArmor")()
    mainWindow.loadFile(path.join(__dirname, "src", "config", "index.html"))
  }
  mainWindow.on("ready-to-show", () => {
    mainWindow.show()
  })

}

app.setAppUserModelId("fr.hydix.emotion")
app.setName("fr.hydix.emotion")

app.whenReady().then(async () => {
  await session.defaultSession.setProxy({
    proxyRules: proxy.rules
  })

  const appPath = app.getAppPath();
  console.log('App directory:', appPath);
  console.log('__dirname:', __dirname);

  await createWindow();
  dev.createDevWindow();

  screen.getAllDisplays().forEach((display) => {
    console.log(`Display: ${display.id}, ${display.size.width}x${display.size.height}, Pos: ${display.bounds.x}x${display.bounds.y} Scale: ${display.scaleFactor}`);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      dev.createDevWindow();
    }
  })
  autoUpdater.checkForUpdates();
  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send("update.available", info)
  })
  autoUpdater.on('update-not-available', (info) => {
    console.log("update not available", info);
  })
  autoUpdater.on('update-downloaded', () => {
    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: 'info',
      buttons: ['Redémarrer et installer', 'Plus tard'],
      title: 'Mise à jour prête',
      message: 'Une nouvelle version a été téléchargée.'
    });
    if (choice === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  globalShortcut.register("Control+Shift+T", () => {
    spawn("x-terminal-emulator")
  })

})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

let datagraph = {}
function saveDatagraph() {
  fs.writeFileSync(path.join(__dirname, "src", "datagraph.json"), JSON.stringify(datagraph))
}
if (!fs.existsSync(path.join(__dirname, "src", "datagraph.json"))) {
  datagraph = {
    data_use: {},
    monthly_data_use: {},
    data_stats: {}
  }
  saveDatagraph()
} else {
  datagraph = JSON.parse(fs.readFileSync(path.join(__dirname, "src", "datagraph.json")).toString())
}

ipcMain.on("spotify.start", (event, opt) => {
  console.log(opt);
  if (libre) {
    return
  }
  libre = spawn(path.join(__dirname, "librespot", "librespot"), [
    '--name', opt.name || "No name",
    '--device-type', 'automobile',
    '--bitrate', opt.bitrate || 320,
    '-k', opt.token,
    '-c', path.join(__dirname, "spoticache"),
    '--cache-size-limit', '20G',
    '-x', `http://${proxy.host}:${proxy.port}`,
  ]);
  libre.stdout.on("data", data => {
    console.log(data.toString());
  })
  libre.stderr.on("data", (d) => {
    console.log(d.toString());
  })
})
ipcMain.on("dataTransfer.get", (event, cb) => {
  cb(proxy.getData())
})
ipcMain.on("dataStats.get", (event, cb) => {
  cb(proxy.stats)
})

ipcMain.handle('i18n-t', (event, key, opts) => {
  return i18next.t(key, opts);
});
ipcMain.handle('i18n-changeLanguage', async (event, lng) => {
  await i18next.changeLanguage(lng);
  return i18next.language;
});
ipcMain.handle('i18n-getLanguage', () => i18next.language);

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