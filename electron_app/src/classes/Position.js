const { ipcRenderer } = require("electron")
const { EventEmitter } = require("events");

class Coords extends EventEmitter {
    constructor() {
        super()
        console.log("✅ Coords class invoked");
        this.longitude = -0.572768
        this.latitude = 44.817956
        this.altitude = 71.6
        this.accuracy = 1
        this.altitudeAccuracy = 1
        this.heading = 90
        ipcRenderer.on("data.heading", (event, bearing) => {
            this.heading = bearing % 360
            this.emit("update")
        })
        ipcRenderer.on("data.position", (event, long, lat) => {
            this.latitude = lat
            this.longitude = long
            this.emit("update")
        })
    }
    get array() {
        return [this.longitude, this.latitude]
    }
}
let coords = new Coords()
class Position {
    constructor() {
        console.log("✅ Position class invoked");
        this.coords = coords
    }
    get timestamp() {
        return Date.now()
    }
}

module.exports = Position