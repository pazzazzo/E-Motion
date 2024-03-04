const path = require('path');
const data = require("../data.json")
const icons = data.icons

class InfoBar {
    #locked = true
    #lockElement = document.getElementById("info-lock").firstElementChild

    #hourElement = document.getElementById("info-hour").firstElementChild

    #tempElement = document.getElementById("info-temp").firstElementChild

    #DOMElement = document.getElementById("info-bar")
    
    constructor() {
        this.#lockElement.innerHTML = icons.lock.close
        this.#hourElement.innerText = "00:00"
        this.#tempElement.innerHTML = "20°C"
    }
    setLocked() {
        this.#locked = true
        this.#lockElement.innerHTML = icons.lock.close
    }
    setUnlocked() {
        this.#locked = false
        this.#lockElement.innerHTML = icons.lock.open
    }
}

module.exports = InfoBar