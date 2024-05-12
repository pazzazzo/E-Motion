let ti = performance.now()
const ErrorHandler = require('./classes/ErrorHandler');
const errorHandler = new ErrorHandler()
const fs = require('fs');
const path = require('path');
const MediaLoader = require("./classes/MediaLoader");
const InfoBar = require('./classes/InfoBar');
const { Chart } = require("chart.js/auto")
const mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');
const Buggy = require('./classes/Buggy');
const Page = require('./classes/Page');

;

const versions = process.versions
const infoBar = new InfoBar()
const buggy = new Buggy()
const page = new Page()
mediaLoader.init()

mediaLoader.on("ready", (t) => {
    page.change("main")
    mediaLoader.playSound("ready")

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

buggy.rearCam.getCams().then(v => {
    buggy.rearCam.setCam(v[0].id)
})

buggy.on("rear.obstacle.detected", (distance) => {
    buggy.rearCam.turnOn().then(s => {
        console.log(s.getVideoTracks()[0]);
        document.getElementById("rear-cam").srcObject = s
        document.getElementById("rear-cam").play()
        page.view.change("rear-cam")
    })
})

