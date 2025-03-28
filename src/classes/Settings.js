const path = require("path")
const fs = require("fs")

class Settings {
    #settings_path = path.join(__dirname, "..", "settings.json")
    #settings_default_path = path.join(__dirname, "..", "settings_default.json")
    constructor() {
        console.log("✅ Settings class invoked");
        this.data = {}
    }
    init(cb) {
        console.log("✅ Settings class init");
        if (typeof cb != "function") {
            throw new Error("Settings init function require a callback in parameters")
        }
        if (!fs.existsSync(this.#settings_path)) {
            cb({ "title": "settings.path.exist.false" })
            return
        }
        if (!fs.existsSync(this.#settings_default_path)) {
            cb({ "title": "settings.default.path.exist.false" })
            return
        }
        this.update(cb)
        return this
    }
    update(cb) {
        fs.readFile(this.#settings_path, (err, data) => {
            if (err && typeof cb == "function") {
                cb({ "title": "unknown.error", "error": err })
            }
            this.data = JSON.parse(data.toString())
            if (typeof cb == "function") {
                cb()
            }
        })
        return this
    }
    save(cb) {
        fs.writeFile(this.#settings_path, JSON.stringify(this.data), (err) => {
            if (typeof cb == "function") {
                if (err) {
                    cb({ "title": "unknown.error", "error": err })
                } else {
                    cb()
                }
            }
        })
        return this
    }
    reset(cb) {
        fs.readFile(this.#settings_default_path, (err, data) => {
            if (err) {
                if (typeof cb == "function") {
                    cb({ "title": "unknown.error", "error": err })
                }
            } else {
                fs.writeFileSync(this.#settings_path, data.toString())
                this.data = JSON.parse(data.toString())
                if (typeof cb == "function") {
                    cb()
                }
            }
        })
        return this
    }
}

module.exports = Settings