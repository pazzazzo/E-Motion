const { ipcRenderer } = require("electron")
const { EventEmitter } = require("events");

class Coords extends EventEmitter {
    constructor() {
        super()
        this.longitude = -0.572768
        this.latitude = 44.817956
        this.altitude = 71.6
        this.accuracy = 1
        this.altitudeAccuracy = 1
        this.heading = 90
        const intervals = {}
        ipcRenderer.on("control.up", (e, p) => {
            if (p) {
                if (intervals.up) {
                    clearInterval(intervals.up)
                }
                intervals.up = setInterval(() => {
                    this.longitude += 0.00001
                    this.emit("update")
                }, 25);
            } else {
                clearInterval(intervals.up)
                delete intervals.up
            }
        })

        ipcRenderer.on("control.down", (e, p) => {
            if (p) {
                if (intervals.down) {
                    clearInterval(intervals.down)
                }
                intervals.down = setInterval(() => {
                    this.longitude -= 0.00001
                    this.emit("update")
                }, 25);
            } else {
                clearInterval(intervals.down)
                delete intervals.down
            }
        })

        ipcRenderer.on("control.left", (e, p) => {
            if (p) {
                if (intervals.left) {
                    clearInterval(intervals.left)
                }
                intervals.left = setInterval(() => {
                    // this.latitude+=0.00001
                    this.heading = (this.heading - 1) % 360
                    this.emit("update")
                }, 5);
            } else {
                clearInterval(intervals.left)
                delete intervals.left
            }
        })

        ipcRenderer.on("control.right", (e, p) => {
            if (p) {
                if (intervals.right) {
                    clearInterval(intervals.right)
                }
                intervals.right = setInterval(() => {
                    // this.latitude -= 0.00001
                    this.heading = (this.heading + 1) % 360
                    this.emit("update")
                }, 5);
            } else {
                clearInterval(intervals.right)
                delete intervals.right
            }
        })
    }
    get array() {
        return [this.longitude, this.latitude]
    }
}
let coords = new Coords()
class Position {
    constructor() {
        this.coords = coords
    }
    get timestamp() {
        return Date.now()
    }
}

module.exports = Position