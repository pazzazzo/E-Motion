const path = require('path');
const { ipcRenderer } = require("electron");
const data = require("../data.json");
const Battery = require('./Battery');
const icons = data.icons

class InfoBar {
    #locked = true
    #lockElement = document.getElementById("info-lock").firstElementChild

    #hourElement = document.getElementById("info-hour").firstElementChild

    #tempElement = document.getElementById("info-temp").firstElementChild

    #batteryElement = document.getElementById("info-battery").firstElementChild
    #batteryTextElement = document.getElementById("info-battery-text").firstElementChild

    #DOMElement = document.getElementById("info-bar")
    
    constructor() {
        this.#lockElement.innerHTML = icons.lock.close
        this.#hourElement.innerText = "00:00"
        this.#tempElement.innerHTML = "20°C"
        this.battery = new Battery()
        this.battery.setMode("charging")
        this.updateBattery()
        ipcRenderer.on("data.temp", (event, temp) => {
            this.#tempElement.innerHTML = `${temp}°C`
        })
        ipcRenderer.on("data.battery", (event, percent) => {

            this.battery.setLevel(percent)
            this.updateBattery()
        })

        setInterval(() => {
            this.updateHour()
        }, 500);
    }
    setLocked() {
        this.#locked = true
        this.#lockElement.innerHTML = icons.lock.close
    }
    setUnlocked() {
        this.#locked = false
        this.#lockElement.innerHTML = icons.lock.open
    }
    updateHour() {
        this.#hourElement.innerText = `${window.utils.formatNumberLen(new Date().getHours())}:${window.utils.formatNumberLen(new Date().getMinutes())}`
    }
    updateBattery() {
        this.#batteryElement.innerHTML = this.battery.getIcon()
        this.#batteryTextElement.innerText = `${this.battery.level}%`
    }
}

module.exports = InfoBar