const Settings = require("./Settings");

class Alerts {
    constructor(settings = new Settings()) {
        console.log("✅ SettingsApp-Alerts class invoked");
        this.settings = settings
    }
}

module.exports = Alerts