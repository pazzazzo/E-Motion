let ti = performance.now()
const ErrorHandler = require('./classes/ErrorHandler');
const errorHandler = new ErrorHandler()
const fs = require('fs');
const path = require('path');
const MediaLoader = require("./classes/MediaLoader");
const { Chart } = require("chart.js/auto")
const mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');
const Buggy = require('./classes/Buggy');
const Page = require('./classes/Page');
const usb = require("usb")
const readline = require('readline');
const { ipcRenderer } = require('electron');
const { SimpleKeyboard } = require("simple-keyboard")


const versions = process.versions
const buggy = new Buggy()
if (!mediaLoader) {
    var mediaLoader = new MediaLoader()
}
mediaLoader.init()

// mediaLoader.page.view.change("data-graph")

mediaLoader.on("ready", (t) => {
    mediaLoader.page.change("main")
    // mediaLoader.playSound("ready")

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

    // setTimeout(() => {
    //     document.getElementsByClassName("simple-keyboard")[0].classList.add("active")
    // }, 1000);

    // mediaLoader.spotify.connect().then((success, err) => {
    //     mediaLoader.spotify.getCurrentTrack().then(v => {
    //         console.log(v);
    //     })
    // })
})

ipcRenderer.on("control.minus", (event, pressed) => {
    if (pressed) {
        mediaLoader.map.zoomOut()
    }
})
ipcRenderer.on("control.plus", (event, pressed) => {
    if (pressed) {
        mediaLoader.map.zoomIn()
    }
})

console.log(`Electron: v${versions.electron}`);
console.log(`Chrome: v${versions.chrome}`);

function getUSBData(vendorIdDec, productIdDec) {
    return new Promise((r, e) => {
        const vendorIdHex = vendorIdDec.toString(16).padStart(4, '0');
        const productIdHex = productIdDec.toString(16).padStart(4, '0');
        const rl = readline.createInterface({
            input: fs.createReadStream(path.join(__dirname, "usb.ids")),
            output: process.stdout,
            terminal: false
        });

        let currentVendor = null;

        rl.on('line', (line) => {
            const vendorMatch = line.match(/^([0-9a-fA-F]{4})\s+(.*)$/);
            if (vendorMatch) {
                const [_, id, name] = vendorMatch;
                if (id.toLowerCase() === vendorIdHex.toLowerCase()) {
                    currentVendor = name;
                } else {
                    currentVendor = null;
                }
            }

            const productMatch = line.match(/^\t([0-9a-fA-F]{4})\s+(.*)$/);
            if (currentVendor && productMatch) {
                const [_, id, name] = productMatch;
                if (id.toLowerCase() === productIdHex.toLowerCase()) {
                    r({ vendor: currentVendor, product: name, success: true })
                    rl.close();
                }
            }
        });

        rl.on('close', () => {
            r({ success: false })
        });

    })
}

usb.usb.on("attach", (device) => {
    console.log(device);
    getUSBData(device.deviceDescriptor.idVendor, device.deviceDescriptor.idProduct).then((r) => {
        console.log(r);
    })
})
usb.usb.on("detach", (device) => {
    getUSBData(device.deviceDescriptor.idVendor, device.deviceDescriptor.idProduct).then((r) => {
        console.log(r);
    })
})


buggy.rearCam.getCams().then(v => {
    buggy.rearCam.setCam(v[0].id)
})

buggy.on("rear.obstacle.detected", (distance) => {
    buggy.rearCam.turnOn().then(s => {
        console.log(s.getVideoTracks()[0]);
        document.getElementById("rear-cam").srcObject = s
        document.getElementById("rear-cam").play()
        mediaLoader.page.view.change("rear-cam")
    })
})

document.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.shiftKey && event.key === 'T') {
        ipcRenderer.send("dev.window.open")
    }
});