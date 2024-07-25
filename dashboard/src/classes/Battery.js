const data = require("../data.json")

class Battery {
    constructor() {
        this.level = 0
        this.mode = "level"
    }
    setLevel(percent) {
        if (percent < 0 || percent > 100) {
            throw new Error(`The battery percentage should be between 0 and 100 (${percent}).`);
        }
        this.level = percent
    }
    setMode(mode = "level") {
        if (!["level", "charging", "alert", "change", "error", "unknown"].includes(mode)) {
            throw new Error(`This battery mode is undefined (${mode}).`)
        }
        this.mode = mode
    }
    getIcon() {
        if (this.mode === "level") {
            return data.icons.battery.level[Math.min(6, Math.floor(this.level / 100 * 6)).toString()]
        } else if (this.mode === "charging") {
            return data.icons.battery.charging[Math.min(6, Math.floor(this.level / 100 * 6)).toString()]
        } else {
            return data.icons.battery[this.mode]
        }
    }
}

module.exports = Battery