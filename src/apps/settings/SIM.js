const Settings = require("./Settings");

class SIM {
    constructor(settings = new Settings()) {
        console.log("✅ SettingsApp-SIM class invoked");
        this.settings = settings
    }
}

module.exports = SIM