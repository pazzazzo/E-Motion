const { EventEmitter } = require("events")


class RearCam {
    constructor() {
        this.stream = null;
        this.selectedCam = null;
    }

    turnOn() {
        return new Promise((resolve, reject) => {
            this.getCams().then(cams => {
                if (cams.length > 0) {
                    const constraints = {
                        video: {
                            deviceId: { exact: this.selectedCam },
                        },
                    };
                    navigator.mediaDevices.getUserMedia(constraints)
                        .then(stream => {
                            this.stream = stream;
                            resolve(stream);
                        })
                        .catch(error => {
                            reject(error);
                        });
                } else {
                    reject("No cameras detected.");
                }
            }).catch(error => {
                reject(error);
            });
        });
    }

    turnOff() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    getCams() {
        return new Promise((resolve, reject) => {
            navigator.mediaDevices.enumerateDevices()
                .then(devices => {
                    const cams = devices.filter(device => device.kind === 'videoinput');
                    resolve(cams.map(cam => ({ id: cam.deviceId, label: cam.label })));
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    setCam(camId) {
        this.selectedCam = camId;
    }
}

class Buggy extends EventEmitter {
    constructor() {
        super()
        this.rearCam = new RearCam()
        setTimeout(() => {
            // this.emit("rear.obstacle.detected", 15)
        }, 5000);
    }
}



module.exports = Buggy