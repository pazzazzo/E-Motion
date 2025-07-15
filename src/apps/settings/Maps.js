const Settings = require("./Settings");

class Maps {
    constructor(settings = new Settings()) {
        console.log("✅ SettingsApp-Maps class invoked");
        this.settings = settings
        this.controls = {
            color: {
                normal: document.getElementById("normal-map-color"),
                traffic: document.getElementById("traffic-map-color"),
                heavy: document.getElementById("heavy-map-color"),
            },
            style: {
                standard: document.getElementById("map-style-standard"),
                dark: document.getElementById("map-style-dark"),
                satellite: document.getElementById("map-style-satellite"),
                terrain: document.getElementById("map-style-terrain"),
            },
            "update-frequency": {
                "15": document.getElementById("update-frequency-15"),
                "30": document.getElementById("update-frequency-30"),
                "60": document.getElementById("update-frequency-60"),
                "300": document.getElementById("update-frequency-300"),
            }
        }

        this.controls.color.normal.value = mediaLoader.settings.data.map.color.route.basic;
        this.controls.color.traffic.value = mediaLoader.settings.data.map.color.route.traffic;
        this.controls.color.heavy.value = mediaLoader.settings.data.map.color.route.heavyTraffic;
        this.controls.color.normal.addEventListener("input", (e) => {
            mediaLoader.settings.data.map.color.route.basic = e.target.value;
        })
        this.controls.color.traffic.addEventListener("input", (e) => {
            mediaLoader.settings.data.map.color.route.traffic = e.target.value;
        })
        this.controls.color.heavy.addEventListener("input", (e) => {
            mediaLoader.settings.data.map.color.route.heavyTraffic = e.target.value;
        })

        this.controls.style[mediaLoader.settings.data.map.style].checked = true;
        for (const controlId in this.controls.style) {
            this.controls.style[controlId].addEventListener("change", (e) => {
                if (e.target.checked) {
                    mediaLoader.settings.data.map.style = e.target.value;
                }
            })
        }

        this.controls["update-frequency"][mediaLoader.settings.data.map.updateFrequency].selected = true;
        for (const controlId in this.controls["update-frequency"]) {
            this.controls["update-frequency"][controlId].addEventListener("change", (e) => {
                if (e.target.checked) {
                    mediaLoader.settings.data.map.updateFrequency = e.target.value;
                }
            })
        }
    }
}

module.exports = Maps