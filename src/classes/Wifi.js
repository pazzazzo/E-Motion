const { EventEmitter } = require("events")
const MediaLoader = require("./MediaLoader");
const data = require("../data.json");

class Wifi extends EventEmitter {
    #wifi
    constructor(mediaLoader = new MediaLoader()) {
        super()
        console.log("✅ Wifi class invoked");
        this.mediaLoader = mediaLoader
        this.#wifi = require("node-wifi");
        this.#wifi.init({ "iface": null })
        this.current = []
        this.networks = []
        this.state = -1
    }
    postInit() {
        window.addEventListener("offline", () => {
            this.emit("offline")
            console.log("❌ Déconnecté du WiFi !");
        });
        window.addEventListener("online", () => {
            this.emit("online")
            console.log("✅ Reconnecté au WiFi !");
        });
        console.log("✅ Wifi class post init");
        this.#updateWifi()
    }
    getConnections(cb) {
        this.#wifi.getCurrentConnections().then(cb)
        // cb([])
    }
    scan(cb) {
        this.#wifi.scan((error, networks) => {
            if (error) {
                console.error("❌ Erreur lors du scan wifi :", error);
                return;
            }
            networks.sort((a, b) => b.signal_level - a.signal_level);
            cb(networks)
        });
    }
    connect(ssid, password, cb) {
        this.#wifi.connect({ ssid, password }, cb);
    }
    #updateWifi() {
        this.getConnections((wifi) => {
            this.current = wifi
            if (wifi.length > 0) {
                if (this.state !== 1) {
                    this.state = 1
                    this.emit("connected")
                }
                this.mediaLoader.infoBar.updateWifi(data.icons.wifi.level[Math.min(6, Math.floor(wifi[0].quality / 100 * 4)).toString()], "Connecté")
                // console.log(`No. ${wifi.length} | Sig. ${wifi[0].quality}`);
            } else {
                if (this.state !== 0) {
                    this.state = 0
                    this.emit("disconnected")
                    this.#notConnected()
                }
                this.mediaLoader.infoBar.updateWifi(data.icons.wifi.off, "Non connecté")
            }
            setTimeout(() => {
                this.#updateWifi()
            }, this.state == 0 ? 1000 : 5000);
        })
    }
    #notConnected() {
        this.mediaLoader.page.view.change("wifi")
        this.scanQRCode((options) => {
            this.connect(options.S, options.P, (...r) => {
                console.log(r);
            })
        })
    }
    scanQRCode(cb) {
        let errHTML = document.getElementById("wifi-error")
        errHTML.classList.add("hidden")
        let canvas = document.getElementById("wifi-cam")
        let video = document.getElementById("wifi-video")
        this.mediaLoader.scanQRCode(canvas, video, (data) => {
            let parse = this.qrParse(data)
            if (!parse.valid) {
                errHTML.classList.remove("hidden")
                errHTML.onclick = () => {
                    this.scanQRCode(cb)
                }
            } else {
                cb(parse)
            }
        })
    }
    qrParse(data) {
        if (data.startsWith("WIFI:")) {
            const params = {valid: true};
            data.slice(5).split(";").forEach(part => {
                if (!part) return;
                const [key, value] = part.split(":");
                if (key && value) params[key] = value;
            });
            return params
        } else {
            return {valid: false}
        }
    }
}


module.exports = Wifi