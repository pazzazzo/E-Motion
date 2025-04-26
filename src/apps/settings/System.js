const Settings = require("./Settings");

class System {
    constructor(settings = new System()) {
        console.log("✅ SettingsApp-System class invoked");
        this.settings = settings
    }
}

module.exports = System