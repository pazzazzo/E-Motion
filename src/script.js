let ti = performance.now()
const ErrorHandler = require('./classes/ErrorHandler');
const errorHandler = new ErrorHandler()
const fs = require('fs');
const path = require('path');
const MediaLoader = require("./classes/MediaLoader");
const { Chart } = require("chart.js/auto")
const mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');
const Vehicle = require('./classes/Vehicle');
const usb = require("usb")
const readline = require('readline');
const { ipcRenderer } = require('electron');
// console.log(url);

const vehicle = new Vehicle()
if (!mediaLoader) {
    var mediaLoader = new MediaLoader()
}


mediaLoader.init()

mediaLoader.on("ready", (t) => {
    mediaLoader.page.change("main")
    // mediaLoader.playSound("ready")
    mediaLoader.mapboxCamera.followUser()
    mediaLoader.map.on("moveend", () => {
        const bounds = mediaLoader.map.getBounds();
        mediaLoader.waze.fetchPolice(bounds)
    });
    console.log(`Media loading took ${t}ms`);
})

navigator.requestMediaKeySystemAccess('com.widevine.alpha', [{
    initDataTypes: ['cenc'],
    audioCapabilities: [{
        contentType: 'audio/mp4; codecs="mp4a.40.2"',
        robustness: 'SW_SECURE_CRYPTO'
    }],
    videoCapabilities: [{
        contentType: 'video/mp4; codecs="avc1.42E01E"',
        robustness: 'SW_SECURE_CRYPTO'
    }]
}])
    .then(() => {
        console.log("✅ Widevine activé et fonctionnel !");
    })
    .catch((err) => {
        console.error("❌ Widevine échoué :", err);
    });

function sp() {
    mediaLoader.spotify.on("ready", (r) => {
        console.log("Spotify ready", r);
    })
    mediaLoader.spotify.on("player.state", state => {
        if (state) {
            if (state.track_window.current_track) {
                // console.log(state);

                console.log("Changement de piste : ", state.track_window.current_track.name);
            }
        }
    })
    mediaLoader.spotify.connect()
}

window.onSpotifyWebPlaybackSDKReady = () => {
    console.log("Spotify loaded");

    if (mediaLoader.ready) {
        sp()
    } else {
        mediaLoader.on("ready", () => {
            sp()
        })
    }
};

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

let speedHTML = document.getElementById("main-speed-value")
let maxHTML = document.getElementById("main-speed-max")
ipcRenderer.on("data.speed", (event, speed) => {
    speedHTML.innerHTML = speed
    if (speed > 110) {
        maxHTML.classList.add("limit")
    } else {
        maxHTML.classList.remove("limit")
    }
})

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
            r({ success: false, vendorIdHex, productIdHex })
        });

    })
}

usb.usb.on("attach", (device) => {
    console.log(device);
    getUSBData(device.deviceDescriptor.idVendor, device.deviceDescriptor.idProduct).then((r) => {
        console.log(r);
        mediaLoader.playSound(mediaLoader.settings.data.sound.usbConnected)
    })
})
usb.usb.on("detach", (device) => {
    getUSBData(device.deviceDescriptor.idVendor, device.deviceDescriptor.idProduct).then((r) => {
        console.log(r);
        mediaLoader.playSound(mediaLoader.settings.data.sound.usbDisconnected)
    })
})


vehicle.rearCam.getCams().then(v => {
    vehicle.rearCam.setCam(v[0].id)
})

vehicle.on("rear.obstacle.detected", (distance) => {
    vehicle.rearCam.turnOn().then(s => {
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