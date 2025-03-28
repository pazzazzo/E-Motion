const versions = process.versions
console.log(`🟢 Electron: v${versions.electron}`);
console.log(`🟢 Chrome: v${versions.chrome}`);

const MediaLoader = require("./classes/MediaLoader");
const Utils = require("./classes/Utils");

const utils = new Utils()
window.utils = utils

const mediaLoader = new MediaLoader()
window.mediaLoader = mediaLoader
mediaLoader.preinit()