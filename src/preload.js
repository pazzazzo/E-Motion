const versions = process.versions
console.log(`🟢 Electron: v${versions.electron}`);
console.log(`🟢 Chrome: v${versions.chrome}`);

const path = require("path")
globalThis.__awd = path.join(__dirname, "..")

const MediaLoader = require("./classes/MediaLoader");
const Utils = require("./classes/Utils");

const utils = new Utils()
globalThis.utils = utils

/**
 * @type {MediaLoader}
 */
globalThis.mediaLoader = new MediaLoader()
mediaLoader.preinit()