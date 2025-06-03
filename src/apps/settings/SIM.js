const Chart = require("../../classes/Chart.js");
const Settings = require("./Settings");

class SIM {
    constructor(settings = new Settings()) {
        console.log("✅ SettingsApp-SIM class invoked");
        this.settings = settings

        this.simChart = new Chart(document.getElementById("settings-sim-use-chart").getContext("2d"), {
            unit: " MB",
        })
        this.simChart.addStat(this.settings.mediaLoader.stats.dataUse, {
            type: "getDatasetsByDatesNumber", args: [new Date(), -13], params: {
                label: "Utilisation",
                rounded: true,
                fill: true
            },
            convertCallback: ((data) => Math.round(data / 1024 / 1024)),
        })
        const typeData = [
            2.00,   // audio-ak.spotifycdn.com: 2 096 684 / 1 048 576 ≈ 2.00 Mo
            0.68,   // web-sdk-assets.spotifycdn.com: 710 420 / 1 048 576 ≈ 0.68 Mo
            0.30,   // i.scdn.co: 315 065 / 1 048 576 ≈ 0.30 Mo
            0.30,   // api.mapbox.com: 312 446 / 1 048 576 ≈ 0.30 Mo
            0.23,   // www.waze.com: 242 388 / 1 048 576 ≈ 0.23 Mo
            0.03,   // api.wit.ai: 36 560 / 1 048 576 ≈ 0.03 Mo
            0.03,   // cpapi.spotify.com: 35 212 / 1 048 576 ≈ 0.03 Mo
            0.03,   // places.googleapis.com: 31 144 / 1 048 576 ≈ 0.03 Mo
            0.03,   // api.spotify.com: 28 208 / 1 048 576 ≈ 0.03 Mo
            0.02,   // gew1-dealer.spotify.com: 25 354 / 1 048 576 ≈ 0.02 Mo
            0.01,   // seektables.scdn.co: 10 149 / 1 048 576 ≈ 0.01 Mo
            0.01,   // events.mapbox.com: 8 894 / 1 048 576 ≈ 0.01 Mo
            0.01,   // maps.googleapis.com: 8 389 / 1 048 576 ≈ 0.01 Mo
            0.01    // apresolve.spotify.com: 7 063 / 1 048 576 ≈ 0.01 Mo
        ]
        const typeLabels = [
            "audio-ak.spotifycdn.com",
            "web-sdk-assets.spotifycdn.com",
            "i.scdn.co",
            "api.mapbox.com",
            "www.waze.com",
            "api.wit.ai",
            "cpapi.spotify.com",
            "places.googleapis.com",
            "api.spotify.com",
            "gew1-dealer.spotify.com",
            "seektables.scdn.co",
            "events.mapbox.com",
            "maps.googleapis.com",
            "apresolve.spotify.com"
        ]
        this.typeChart = new Chart(document.getElementById("settings-sim-type-chart").getContext("2d"), {
            x: typeLabels,
            y: [
                {
                    data: typeData,
                    label: "Utilisation",
                    rounded: true,
                    fill: true
                }
            ],
            unit: " MB",
            type: "bar",
            horizontal: true,
            height: `${2 * typeLabels.length}rem`
        })
    }
}

module.exports = SIM