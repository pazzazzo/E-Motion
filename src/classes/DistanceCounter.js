const { ipcRenderer } = require("electron")

class DistanceCounter {
    constructor() {
        console.log("✅ Distance class invoked");
        this.distance = 0
        this.lastSpeed = 0
        this.lastEvent = performance.now()
        ipcRenderer.on("data.speed", (event, speed) => {
            if (speed != this.lastSpeed) {
                let delta = performance.now() - this.lastEvent
                this.lastEvent = performance.now()
                let lastSpeed = this.lastSpeed
                this.lastSpeed = speed

                this.distance += ((lastSpeed * 1000) / 3600) * (delta/1000)
            }
            // console.log(this.distance);
            
        })
    }
}

module.exports = DistanceCounter