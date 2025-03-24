const MediaLoader = require("./classes/MediaLoader");
const Utils = require("./classes/Utils");

const utils = new Utils()
window.utils = utils

const mediaLoader = new MediaLoader()
window.mediaLoader = mediaLoader
mediaLoader.preinit()