const { app, BrowserWindow, ipcMain } = require('electron')
// const can = require('socketcan');

class VehicleConnect {
    constructor(config = { mainWindow: new BrowserWindow() }) {
        this.mainWindow = config.mainWindow
        // try {
        //     this.channel = can.createRawChannel("vcan0", true);
        // } catch (error) {
        //     console.log(error);
        // }
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
    positonChange(long, lat) {
        this.mainWindow.webContents.send("data.position", long, lat)
    }
    headindChange(bearing) {
        this.mainWindow.webContents.send("data.heading", bearing)
    }
    controlClick(name, pressed) {
        this.mainWindow.webContents.send(`control.${name}`, pressed)
    }
    getVIN() {
        return "ZFF*abcdef*000000"
    }
    checkVIN() {
        return true
    }
}

module.exports = VehicleConnect