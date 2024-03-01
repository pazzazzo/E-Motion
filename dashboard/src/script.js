const fs = require('fs');
const path = require('path');
const MediaLoader = require("./MediaLoader");
const InfoBar = require('./InfoBar');
const {Chart} = require("chart.js/auto")
const mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');

const versions = process.versions
const mediaLoader = new MediaLoader()
const infoBar = new InfoBar()
let ti = performance.now()
mediaLoader.init()

mediaLoader.on("ready", (t) => {
    mediaLoader.playSound("ready")
    document.getElementById("load-logo").src = mediaLoader.getImage("logo-text")

    mediaLoader.map.addControl(
        new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserHeading: true,
            geolocation: {
                watchPosition: (s) => {
                    s(new Position())
                    setInterval(() => {
                        s(new Position())
                    }, 500);
                }
            }
        })
    );
    setTimeout(() => {
        document.getElementsByClassName("mapboxgl-ctrl-geolocate")[0].click()
    }, 10);

    console.log(`Media loading took ${t}ms`);
})

console.log(`Electron: v${versions.electron}`);
console.log(`Chrome: v${versions.chrome}`);

class Coords {
    constructor() {
        // this.latitude = 45.213622,
        this.longitude = -0.572768,
            this.altitude = 71.6,
            this.accuracy = 1,
            this.altitudeAccuracy = 1,
            // this.heading = 90,
            this.speed = 0
    }
    get latitude() {
        return 44.817956
    }
    get heading() {
        console.log("oui");
        return 90
    }
}
class Position {
    constructor() {
        this.timestamp = Date.now()
        this.coords = new Coords()
    }

}

let ctx = document.getElementById("speedometer").getContext("2d")
let chart = new Chart(ctx, {
    type: "doughnut",
    data: {
        labels: ["Speed", "None"],
        datasets: [
            {
                label: "speed",
                data: [50, 50],
                backgroundColor: ["#f000f0", "#a0a0a0"],
            }
        ],
    },
    options: {
        borderColor: "transparent",
        cutout: "90%",
        responsive: false,
        maintainAspectRatio: false,
        aspectRatio: 2,
        hover: false,
        circumference: 180,
        rotation: 270, 
        animation: {
            animateRotate: false
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                enabled: false
            },
        }
    }
})
