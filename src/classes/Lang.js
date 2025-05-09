const MediaLoader = require("./MediaLoader");
const { ipcRenderer } = require("electron");

class Lang {
    constructor(mediaLoader = new MediaLoader()) {
        console.log("✅ Lang class invoked");
        this.mediaLoader = mediaLoader;

    }
    t(key, opts = {}) {
        return ipcRenderer.invoke("i18n-t", key, opts);
    }
    changeLanguage(lng) {
        return ipcRenderer.invoke("i18n-changeLanguage", lng);
    }
    getLanguage() {
        return ipcRenderer.invoke("i18n-getLanguage");
    }
}

module.exports = Lang