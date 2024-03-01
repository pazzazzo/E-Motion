const MediaLoader = require("./MediaLoader");
const { contextBridge } = require('electron')

const mediaLoader = new MediaLoader()
mediaLoader.preinit()
window.mediaLoader = mediaLoader
// contextBridge.exposeInMainWorld("mediaLoader", mediaLoader)


const simulatedEvent = new DeviceOrientationEvent('deviceorientationabsolute', {
    absolute: true,
    alpha: -90,
    beta: 0,
    gamma: 0
});

setInterval(() => {
    window.dispatchEvent(simulatedEvent);
}, 500);