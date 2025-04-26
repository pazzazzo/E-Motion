const Settings = require("./Settings");

class Camera {
    constructor(settings = new Settings()) {
        console.log("✅ SettingsApp-Camera class invoked");
        this.settings = settings
    }
}

module.exports = Camera