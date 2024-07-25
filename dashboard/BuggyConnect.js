const { app, BrowserWindow, ipcMain } = require('electron')


class BuggyConnect {
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
}

module.exports = BuggyConnect