const { app, BrowserWindow, ipcMain, screen } = require('electron')
const path = require('node:path');
const VehicleConnect = require('./VehicleConnect');

class Dev {
    constructor(config = { vehicleConnect: new VehicleConnect() }) {
        this.isDev && console.log("Dev mode");
        this.vehicleConnect = config.vehicleConnect
        this.accelInterval;
        this.speed = 0;
        this.heading = 90
        this.longitude = -0.572768
        this.latitude = 44.817956
        const intervals = {}
        ipcMain.on("dev.button", (event, data) => {
            console.log("btn", data);
            if (data.name === "accelerator") {
                if (data.pressed) {
                    clearInterval(this.accelInterval)
                    this.accelInterval = setInterval(() => {
                        this.speed = Math.min(this.speed + 1, 160)
                        this.vehicleConnect.speedChange(this.speed)
                    }, 62)
                } else {
                    clearInterval(this.accelInterval)
                    this.accelInterval = setInterval(() => {
                        this.speed = Math.max(this.speed - 1, 0)
                        this.vehicleConnect.speedChange(this.speed)
                    }, 400)
                }
            }
            if (data.name === "breaks") {
                if (data.pressed) {
                    clearInterval(this.accelInterval)
                    this.accelInterval = setInterval(() => {
                        this.speed = Math.max(this.speed - 1, 0)
                        this.vehicleConnect.speedChange(this.speed)
                    }, 62)
                } else {
                    clearInterval(this.accelInterval)
                    this.accelInterval = setInterval(() => {
                        this.speed = Math.max(this.speed - 1, 0)
                        this.vehicleConnect.speedChange(this.speed)
                    }, 400)
                }
            }
            if (["minus", "plus", "stats", "ok", "mic", "back"].includes(data.name)) {
                this.vehicleConnect.controlClick(data.name, data.pressed)
            }
            if (data.name == "up") {
                if (data.pressed) {
                    let speed = 0.00001
                    if (intervals.up) {
                        clearInterval(intervals.up)
                    }
                    intervals.up = setInterval(() => {
                        this.latitude += speed * Math.cos(this.heading * (Math.PI / 180))
                        this.longitude += speed * Math.sin(this.heading * (Math.PI / 180))
                        this.vehicleConnect.positonChange(this.longitude, this.latitude)
                    }, 25);
                } else {
                    clearInterval(intervals.up)
                    delete intervals.up
                }
            }

            if (data.name == "down") {
                if (data.pressed) {
                    if (intervals.down) {
                        clearInterval(intervals.down)
                    }
                    intervals.down = setInterval(() => {
                        this.latitude -= 0.00001 * Math.cos(this.heading * (Math.PI / 180))
                        this.longitude -= 0.00001 * Math.sin(this.heading * (Math.PI / 180))
                        this.vehicleConnect.positonChange(this.longitude, this.latitude)
                    }, 25);
                } else {
                    clearInterval(intervals.down)
                    delete intervals.down
                }
            }

            if (data.name == "left") {
                if (data.pressed) {
                    if (intervals.left) {
                        clearInterval(intervals.left)
                    }
                    intervals.left = setInterval(() => {
                        this.heading = (this.heading - 5) % 360
                        this.vehicleConnect.headindChange(this.heading)
                    }, 50);
                } else {
                    clearInterval(intervals.left)
                    delete intervals.left
                }
            }

            if (data.name == "right") {
                if (data.pressed) {
                    if (intervals.right) {
                        clearInterval(intervals.right)
                    }
                    intervals.right = setInterval(() => {
                        this.heading = (this.heading + 5) % 360
                        this.vehicleConnect.headindChange(this.heading)
                    }, 50);
                } else {
                    clearInterval(intervals.right)
                    delete intervals.right
                }
            }
        })
        ipcMain.on("dev.switch", (event, data) => {
            console.log("sw", data);
        })
        ipcMain.on("dev.cursor", (event, data) => {
            console.log("dt", data);
            if (data.name === "temp") {
                this.vehicleConnect.tempChange(data.value)
            } else if (data.name === "battery") {
                this.vehicleConnect.batteryChange(data.value)
            }
        })
        ipcMain.on("dev.window.open", () => {
            this.createDevWindow()
        })
    }
    get isDev() {
        return process.argv.includes("-dev")
    }
    get isDemo() {
        return process.argv.includes("--demo")
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
        if (this.isDemo) {
            let screens = screen.getAllDisplays()
            let devScreen = screens[screens.length - 1].bounds
            this.devWindow.setPosition(devScreen.x, devScreen.y)
            this.devWindow.setFullScreen(true)
        }
    }
}

module.exports = Dev