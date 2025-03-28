const { app, BrowserWindow, ipcMain } = require('electron')


class VehicleConnect {
    constructor(config = {mainWindow: new BrowserWindow()}) {
        this.mainWindow = config.mainWindow
    }
    speedChange(speed) {
        this.mainWindow.webContents.send("data.speed", speed)
    }
    tempChange(temp) {
        this.mainWindow.webContents.send("data.temp", temp)
    }
    batteryChange(percent) {
        this.mainWindow.webContents.send("data.battery", percent)
    }
    controlClick(name, pressed) {
        this.mainWindow.webContents.send(`control.${name}`, pressed)
    }
}

module.exports = VehicleConnect