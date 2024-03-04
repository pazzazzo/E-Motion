const MediaLoader = require("./classes/MediaLoader");
const { contextBridge } = require('electron');
const Utils = require("./classes/Utils");

const mediaLoader = new MediaLoader()
const utils = new Utils()
mediaLoader.preinit()
window.mediaLoader = mediaLoader
window.utils = utils
// contextBridge.exposeInMainWorld("mediaLoader", mediaLoader)

class Coords {
    constructor() {
        // this.latitude = 45.213622,
        this.longitude = -0.572768,
            this.altitude = 71.6,
            this.accuracy = 1,
            this.altitudeAccuracy = 1,
            // this.heading = 90,
            this.speed = 0
    }
    get latitude() {
        return 44.817956
    }
    get heading() {
        console.log("oui");
        return 90
    }
}
class Position {
    constructor() {
        this.timestamp = Date.now()
        this.coords = new Coords()
    }

}

window.Coords = Coords
window.Position = Position

const simulatedEvent = new DeviceOrientationEvent('deviceorientationabsolute', {
    absolute: true,
    alpha: -90,
    beta: 0,
    gamma: 0
});

setInterval(() => {
    window.dispatchEvent(simulatedEvent);
}, 500);