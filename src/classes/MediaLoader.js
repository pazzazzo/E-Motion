const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const Database = require('./Database');
const DataGraph = require("./DataGraph")
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
        this.preinitied = false;
        this.ready = false;
        this.database = new Database()
        this.dataGraph = new DataGraph()
    }
    preinit() {
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
            this.#preloadApps()
        }
    }
    init() {
        const cont = () => {
            const t = performance.now()
            let i = 4
            this.page = new Page()
            this.infoBar = new InfoBar()
            this.spotify = new SpotifyClient(this)
            this.searchAddress = new SearchAddress(this)
            this.navbar = new Navbar(this)
            this.direction = new Direction(this)
            this.settings = new Settings()
            this.waze = new Waze(this)
            const cb = () => {
                i--
                if (i <= 0) {
                    this.#postInit(() => {
                        this.emit("ready", performance.now() - t)
                        this.ready = true
                    })
                }
            }
            this.#loadMap(this.database.data["mapbox-token"], cb)
            this.dataGraph.init(cb)
            this.spotify.init(cb)
            this.settings.init(cb).reset()
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
        this.arrow = new Arrow(this)
        this.mapboxCamera = new MapboxCamera(this)
        
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
    get soundsList() {
        return Object.keys(this.#sounds_buffer)
    }
}


module.exports = MediaLoader