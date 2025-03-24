const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path');
const BuggyConnect = require('./BuggyConnect');

class Dev {
    constructor(config = { buggyConnect: new BuggyConnect() }) {
        this.isDev && console.log("Dev mode");
        this.buggyConnect = config.buggyConnect
        this.accelInterval;
        this.speed = 0;

        ipcMain.on("dev.button", (event, data) => {
            console.log("btn", data);
            if (data.name === "accelerator") {
                if (data.pressed) {
                    clearInterval(this.accelInterval)
                    this.accelInterval = setInterval(() => {
                        this.speed = Math.min(this.speed + 1, 160)
                        this.buggyConnect.speedChange(this.speed)
                    }, 62)
                } else {
                    clearInterval(this.accelInterval)
                    this.accelInterval = setInterval(() => {
                        this.speed = Math.max(this.speed - 1, 0)
                        this.buggyConnect.speedChange(this.speed)
                    }, 400)
                }
            }
            if (data.name === "breaks") {
                if (data.pressed) {
                    clearInterval(this.accelInterval)
                    this.accelInterval = setInterval(() => {
                        this.speed = Math.max(this.speed - 1, 0)
                        this.buggyConnect.speedChange(this.speed)
                    }, 62)
                } else {
                    clearInterval(this.accelInterval)
                    this.accelInterval = setInterval(() => {
                        this.speed = Math.max(this.speed - 1, 0)
                        this.buggyConnect.speedChange(this.speed)
                    }, 400)
                }
            }
            if (["minus", "up", "plus", "stats", "left", "ok", "right", "mic", "down", "back"].includes(data.name)) {
                this.buggyConnect.controlClick(data.name, data.pressed)
            }
        })
        ipcMain.on("dev.switch", (event, data) => {
            console.log("sw", data);
        })
        ipcMain.on("dev.cursor", (event, data) => {
            console.log("dt", data);
            if (data.name === "temp") {
                this.buggyConnect.tempChange(data.value)
            } else if (data.name === "battery") {
                this.buggyConnect.batteryChange(data.value)
            }
        })
        ipcMain.on("dev.window.open", () => {
            this.createDevWindow()
        })
    }
    get isDev() {
        return process.argv.includes("-dev")
    }
    createDevWindow = () => {
        if (!this.isDev) {
            return
        }
        this.devWindow = new BrowserWindow({
            width: 1024,
            height: 600,
            autoHideMenuBar: true,
            show: false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true,
                nodeIntegrationInWorker: true,
            }
        })

        this.devWindow.loadFile(path.join(__dirname, "dev", "index.html"))
        this.devWindow.on("ready-to-show", () => {
            this.devWindow.show()
        })

    }
}

module.exports = Dev