const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
// const mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');
const Database = require('./Database');
const Speedometer = require('./Speedometer');
const Powermeter = require('./Powermeter');


class MediaLoader extends EventEmitter {
    #sounds_buffer = {}
    #images_buffer = {}
    #path = {
        media: path.join(__dirname, "..", "media"),
        sounds: path.join(__dirname, "..", "media", "sounds"),
        images: path.join(__dirname, "..", "media", "images")
    }
    constructor(config = {}) {
        super()
        this.preinitied = false;
        this.ready = false;
        this.database = new Database()
        this.speedometer = new Speedometer()
        this.powermeter = new Powermeter()
    }
    preinit() {
        if (!this.preinitied) {
            const t = performance.now()
            let i = 0
            const cb = () => {
                i++
                if (i === 3) {
                    this.emit("preloaded", performance.now() - t)
                    this.preinitied = true
                }
            }

            this.once("sounds.load.finish", cb)
            this.once("images.load.finish", cb)
            this.#loadSounds()
            this.#loadImages()
            this.database.load((err) => {
                if (err) throw err;
                cb()
            })

        }
    }
    init() {
        const cont = () => {
            const t = performance.now()
            let i = 0

            const cb = () => {
                i++
                if (i === 2) {
                    this.speedometer.init()
                    this.powermeter.init()
                    this.emit("ready", performance.now() - t)
                    this.ready = true
                }
            }
            this.#loadDOMSrc(cb)
            this.once("map.load.finish", cb)
            this.#loadMap(this.database.data["mapbox-token"])
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
    #loadDOMSrc(cb) {
        for (const image in this.#images_buffer) {
            for (let i = 0; i < document.getElementsByClassName("img-" + image).length; i++) {
                const img = document.getElementsByClassName("img-" + image)[i];
                img.src = this.#images_buffer[image]
            }
        }
        cb()
    }
    #loadSounds() {
        fs.readdir(this.#path.sounds, (err, files) => {
            if (err) {
                return this.emit("sounds.load.error", { "type": "dir.read", "error": err })
            }
            let q = 0
            files.forEach((file, i) => {
                const t = performance.now()
                this.#preloadSound(path.join(this.#path.sounds, file), (data) => {
                    if (data) {
                        q++
                        this.#sounds_buffer[file.replace(/\.\w+/g, "")] = data;
                        this.emit("sounds.load.step", { "i": i + 1, "total": files.length, "time": performance.now() - t })
                        if (q === files.length) {
                            this.emit("sounds.load.finish")
                        }
                    }
                })
            })
        })
    }
    #loadImages() {
        fs.readdir(this.#path.images, (err, files) => {
            if (err) {
                return this.emit("images.load.error", { "type": "dir.read", "error": err })
            }
            let q = 0
            files.forEach((file, i) => {
                const t = performance.now()
                this.#preloadImage(path.join(this.#path.images, file), (data) => {
                    if (data) {
                        q++
                        this.#images_buffer[file.replace(/\.\w+/g, "")] = data;
                        this.emit("images.load.step", { "i": i + 1, "total": files.length, "time": performance.now() - t })
                        if (q === files.length) {
                            this.emit("images.load.finish")
                        }
                    }
                })
            })
        })
    }
    #loadMap(token) {
        mapboxgl.accessToken = token;
        this.map = new mapboxgl.Map({
            container: 'map-box',
            style: 'mapbox://styles/pazzazzo/clsw8ron1007w01me2kb437ln'
        });
        this.map.on("load", () => {
            this.emit("map.load.finish")
        })
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
    #preloadImage(path, callback) {
        fs.readFile(path, (err, data) => {
            if (err) {
                this.emit("image.preload.error", { "type": "file.read", "error": err })
                return callback(false)
            }
            const imageData = 'data:image/jpeg;base64,' + data.toString('base64');

            return callback(imageData)
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
    getImage(name) {
        return this.#images_buffer[name]
    }
    get soundsList() {
        return Object.keys(this.#sounds_buffer)
    }
    get imagesList() {
        return Object.keys(this.#images_buffer)
    }
}


module.exports = MediaLoader