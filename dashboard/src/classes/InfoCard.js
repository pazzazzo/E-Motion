const path = require('path');
const { ipcRenderer } = require("electron");
const data = require("../data.json")
const icons = data.icons

class InfoCard {
    #speedElement = document.getElementById("speed-card")
    #maxSpeedElement = document.getElementById("max-speed-card")

    #powerElement = document.getElementById("power-card")
    #maxPowerElement = document.getElementById("max-power-card")

    #traveledElement = document.getElementById("traveled-card")
    #remainingElement = document.getElementById("remaining-card")

    #time1Element = document.getElementById("time-1-card")
    #timeu1Element = document.getElementById("time-u1-card")
    #time2Element = document.getElementById("time-2-card")
    #timeu2Element = document.getElementById("time-u2-card")

    #tempElement = document.getElementById("temp-card")

    #maxSpeed = 0

    constructor() {
        this.#speedElement.innerText = "0"
        this.#maxSpeedElement.innerText = "0"

        this.#powerElement.innerText = "0"
        this.#maxPowerElement.innerText = "0"

        this.#traveledElement.innerText = "0"
        this.#remainingElement.innerText = "0"

        this.#time1Element.innerText = "0"
        this.#timeu1Element.innerText = "min"
        this.#time2Element.innerText = "0"
        this.#timeu2Element.innerText = "s"

        this.#tempElement.innerText = "20"


        ipcRenderer.on("data.speed", (event, speed) => {
            this.updateSpeed(speed)
        })
        ipcRenderer.on("data.temp", (event, temp) => {
            this.updateTemp(temp)
        })
    }
    updateSpeed(speed) {
        if (speed > this.#maxSpeed) {
            this.updateMaxSpeed(speed)
        }
        this.#speedElement.innerText = speed
    }
    updateMaxSpeed(speed) {
        this.#maxSpeed = speed
        this.#maxSpeedElement.innerText = speed
    }

    updateTemp(temp) {
        this.#tempElement.innerHTML = `${temp}`
    }
}

module.exports = InfoCard