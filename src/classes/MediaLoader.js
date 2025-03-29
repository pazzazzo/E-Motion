const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const Database = require('./Database');
// const DataGraph = require("./DataGraph")
const InfoBar = require('./InfoBar');
const SpotifyClient = require('./SpotifyClient');
const SearchAddress = require('./SearchAddress');
const Page = require('./Page');
const Direction = require('./Direction');
const Navbar = require('./Navbar');
const Settings = require('./Settings');
const Waze = require('./Waze');
const Arrow = require('./Arrow');
const MapboxObject = require('./MapboxObject');
const MapboxCamera = require('./MapboxCamera');
const Position = require('./Position');
const Wifi = require('./Wifi');
const { default: jsQR } = require('jsqr');
const VoiceControl = require('./VoiceControl');
const PlaceSearch = require('./PlaceSearch');


class MediaLoader extends EventEmitter {
    #sounds_buffer = {}
    #images_buffer = {}
    #path = {
        media: path.join(__dirname, "..", "media"),
        sounds: path.join(__dirname, "..", "media", "sounds"),
        apps: path.join(__dirname, "..", "apps"),
    }
    constructor(config = {}) {
        super()
        console.log("✅ MediaLoader class invoked");
        this.preinitied = false;
        this.ready = false;
        this.database = new Database()
        // this.dataGraph = new DataGraph()
    }
    preinit() {
        console.log("🟠 MediaLoader class pre init");
        if (!this.preinitied) {
            const t = performance.now()
            let i = 1
            const cb = () => {
                i--
                if (i == 0) {
                    this.emit("preloaded", performance.now() - t)
                    this.preinitied = true
                }
            }
            this.position = new Position()
            this.#loadSounds()
            this.database.load((err) => {
                if (err) throw err;
                cb()
            })
            this.wifi = new Wifi(this)
            this.#preloadApps()
        }
    }
    init() {
        console.log("🟡 MediaLoader class init");
        const cont = () => {
            const t = performance.now()
            let i = 4
            this.page = new Page()
            this.infoBar = new InfoBar(this)
            this.spotify = new SpotifyClient(this)
            this.searchAddress = new SearchAddress(this)
            this.navbar = new Navbar(this)
            this.direction = new Direction(this)
            this.settings = new Settings()
            this.waze = new Waze(this)
            this.placeSearch = new PlaceSearch(this)
            const cb = () => {
                i--
                if (i <= 0) {
                    this.#postInit(() => {
                        this.emit("ready", performance.now() - t)
                        this.ready = true
                        console.log("🟢 MediaLoader ready");
                    })
                }
            }
            this.#loadMap(this.database.data["mapbox-token"], cb)
            // this.dataGraph.init(cb)
            this.spotify.init(cb)
            this.settings.init(cb).reset()
            this.placeSearch.init(cb)
        }
        if (!this.ready) {
            if (this.preinitied) {
                cont()
            } else {
                this.once("preloaded", cont)
            }
        } else {
            console.warn("MediaLoader already ready!")
        }
        return this
    }
    #postInit(cb) {
        console.log("🔵 MediaLoader class post init");
        this.arrow = new Arrow(this)
        this.mapboxCamera = new MapboxCamera(this)
        this.voiceControl = new VoiceControl(this)
        this.wifi.postInit()
        cb()
    }
    #preloadApps() {
        this.apps = new Map()
        fs.readdir(this.#path.apps, (err, dirs) => {
            dirs.forEach(dir => {
                if (dir !== "App.js") {
                    let appPath = path.join(this.#path.apps, dir)
                    let manifest = require(path.join(appPath, "manifest.json"))
                    this.apps.set(manifest.id, appPath)
                }
            })
        })
    }
    #loadSounds() {
        fs.readdir(this.#path.sounds, (err, files) => {
            if (err) {
                return this.emit("sounds.load.error", { "type": "dir.read", "error": err })
            }
            files.forEach((file, i) => {
                const t = performance.now()
                this.#preloadSound(path.join(this.#path.sounds, file), (data) => {
                    if (data) {
                        this.#sounds_buffer[file.replace(/\.\w+/g, "")] = data;
                    }
                })
            })
        })
    }
    #loadMap(token, cbr) {
        mapboxgl.accessToken = token;
        this.map = new mapboxgl.Map({
            container: 'map-box',
            style: 'mapbox://styles/pazzazzo/cm7rqvhkk005n01s580b12mko',
            // optimizeForTerrain: true,
            // attributionControl: false,
            antialias: false,
            maxZoom: 20
        });
        let loads = 3
        const cb = () => {
            loads--;
            if (loads <= 0) {
                cbr()
            }
        }
        this.map.once("load", cb)
        this.map.once("idle", cb)
        this.map.once("renderstart", cb)
    }
    #preloadSound(path, callback) {
        fs.readFile(path, (err, data) => {
            if (err) {
                this.emit("sound.preload.error", { "type": "file.read", "error": err })
                return callback(false)
            }
            const audioData = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);

            const audioContext = new AudioContext();
            audioContext.decodeAudioData(audioData, (buffer) => {
                return callback(buffer)
            }, (err) => {
                this.emit("sound.preload.error", { "type": "audioContext.decodeAudioData", "error": err })
                return callback(false)
            });
        })
    }
    playSound(name, finish) {
        if (this.#sounds_buffer[name]) {
            const audioContext = new AudioContext();
            const source = audioContext.createBufferSource();
            finish && source.addEventListener("ended", (ev) => { finish(ev) })
            source.buffer = this.#sounds_buffer[name];
            source.connect(audioContext.destination);
            source.start();
        }
    }
    scanQRCode(canvas, video, cb) {
        let ctx = canvas.getContext("2d")
        navigator.mediaDevices.getUserMedia({ audio: false, video: true }).then((stream) => {
            video.srcObject = stream
            video.play()
            let data;
            let interval = setInterval(() => {
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                if (canvas.width > 0) {
                    data = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height) || data
                    if (data) {
                        clearInterval(interval)
                        for (const key in data.location) {
                            if (key.endsWith("Corner")) {
                                let point = data.location[key]
                                ctx.fillStyle = "#ff0000"
                                ctx.fillRect(point.x - 5, point.y - 5, 10, 10)
                            }
                        }
                        video.pause()
                        stream.getTracks().forEach(function (track) {
                            track.stop();
                        });
                        setTimeout(() => {
                            cb(data.data, data)
                        }, 500);
                    }
                }
            }, 5);
        })
    }
    get soundsList() {
        return Object.keys(this.#sounds_buffer)
    }
}


module.exports = MediaLoader