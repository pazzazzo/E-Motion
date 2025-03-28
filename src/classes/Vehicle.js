const { EventEmitter } = require("events");
const RearCam = require("./RearCam");
const DistanceCounter = require("./DistanceCounter");

class Vehicle extends EventEmitter {
    constructor() {
        super()
        console.log("✅ Vehicle class invoked");
        this.rearCam = new RearCam()
        this.distanceCounter = new DistanceCounter()
        setTimeout(() => {
            // this.emit("rear.obstacle.detected", 15)
        }, 5000);
    }
}



module.exports = Vehicle