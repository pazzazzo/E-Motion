const MediaLoader = require("./MediaLoader");
const { ipcRenderer } = require("electron");

class Lang {
    constructor(mediaLoader = new MediaLoader()) {
        console.log("✅ Lang class invoked");
        this.mediaLoader = mediaLoader;
        this.i18nElements = document.getElementsByClassName("i18n")
        for (const i18nEl of this.i18nElements) {
            this.asyncT(i18nEl, this.getKey(i18nEl))
        }
    }
    getKey(element) {
        switch (element.tagName) {
            case 'INPUT':
                return 'placeholder'
            default:
                return 'innerHTML'
        }
    }
    async updateElement(element, key, opts = {}) {
        element[this.getKey(element)] = await this.t(key, opts)
    }
    async asyncT(element, key, opts = {}) {
        element[key] = await this.t(element[key], opts)
        console.log(await this.t(element[key], opts));
        
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