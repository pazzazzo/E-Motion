const textToSpeech = require('@google-cloud/text-to-speech');
const SpotifyClient = require('./SpotifyClient');
const SearchAddress = require('./SearchAddress');
const MapboxCamera = require('./MapboxCamera');
const VoiceControl = require('./VoiceControl');
const PlaceSearch = require('./PlaceSearch');
const MusicPlayer = require('./MusicPlayer');
const { default: jsQR } = require('jsqr');
const AppLoader = require('./AppLoader');
const Direction = require('./Direction');
const Bluetooth = require('./Bluetooth');
const EventEmitter = require('events');
const Position = require('./Position');
const Settings = require('./Settings');
const Database = require('./Database');
const InfoBar = require('./InfoBar');
const Navbar = require('./Navbar');
const Arrow = require('./Arrow');
const Stats = require('./Stats');
const Waze = require('./Waze');
const Wifi = require('./Wifi');
const Page = require('./Page');
const Lang = require('./Lang');
const path = require('path');
const fs = require('fs');


class MediaLoader extends EventEmitter {
    #sounds_buffer = {}
    #voices_buffer = {}
    #images_buffer = {}
    #path = {
        media: path.join(__dirname, "..", "media"),
        sounds: path.join(__dirname, "..", "media", "sounds"),
        voices: path.join(__dirname, "..", "media", "voices"),
        apps: path.join(__dirname, "..", "apps"),
        datagraph: path.join(__dirname, "..", "datagraph.json"),
    }
    constructor(config = {}) {
        super()
        console.log("✅ MediaLoader class invoked");
        this.preinitied = false;
        this.ready = false;
        this.database = new Database()
        this.status = "none"
        this.lastSpotifyVolume = null
        this.soundPlaying = 0
        // this.dataGraph = new DataGraph()
    }
    preinit() {
        console.log("🟠 MediaLoader class pre init");
        if (!this.preinitied) {
            this.status = "preinit"
            const t = performance.now()
            let i = 2
            const cb = () => {
                i--
                if (i == 0) {
                    this.emit("preloaded", performance.now() - t)
                    this.preinitied = true
                }
            }
            this.position = new Position()
            this.#loadSounds(cb)
            this.wifi = new Wifi()
            this.stats = new Stats()
            this.ttsClient = new textToSpeech.TextToSpeechClient();
            this.#preloadApps()
            cb()
        }
    }
    init() {
        console.log("🟡 MediaLoader class init");
        this.status = "init"
        const cont = () => {
            const t = performance.now()
            let i = 5
            this.page = new Page()
            this.infoBar = new InfoBar()
            this.spotify = new SpotifyClient()
            this.bluetooth = new Bluetooth()
            this.musicPlayer = new MusicPlayer()
            this.searchAddress = new SearchAddress()
            this.navbar = new Navbar()
            this.direction = new Direction()
            this.settings = new Settings()
            this.waze = new Waze()
            this.placeSearch = new PlaceSearch()
            const cb = () => {
                i--
                if (i <= 0) {
                    this.#postInit(() => {
                        this.status = "loaded"
                        this.emit("ready", performance.now() - t)
                        this.ready = true
                        console.log("🟢 MediaLoader ready");
                    })
                }
            }
            this.database.get("mapbox-token").then(token => {
            this.#loadMap(token, cb)
            })
            // this.dataGraph.init(cb)
            this.spotify.init(cb)
            this.settings.init(cb)
            this.placeSearch.init(cb)
            this.bluetooth.init().then(cb)
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
        this.status = "postinit"
        console.log("🔵 MediaLoader class post init");
        this.arrow = new Arrow()
        this.mapboxCamera = new MapboxCamera()
        this.voiceControl = new VoiceControl()
        this.appLoader = new AppLoader()
        this.lang = new Lang()
        this.navbar.postInit()
        this.wifi.postInit()
        cb()
    }
    #preloadApps() {
        this.apps = new Map()
        fs.readdir(this.#path.apps, (err, dirs) => {
            dirs.forEach(dir => {
                if (dir !== "App.js") {
                    let appPath = path.join(this.#path.apps, dir)
                    let manifest = JSON.parse(fs.readFileSync(path.join(appPath, "manifest.json"), "utf-8"))
                    this.apps.set(manifest.id, appPath)
                }
            })
        })
    }
    #loadSounds(cb) {
        let totalFiles = 0;
        let loadedFiles = 0;

        // Function to check if everything is loaded
        const checkDone = () => {
            if (loadedFiles === totalFiles) {
                cb();
            }
        };

        const audioContext = new AudioContext();
        fs.readdir(this.#path.sounds, (err, soundFiles) => {
            if (err) {
                return this.emit("sounds.load.error", { "type": "dir.read", "error": err });
            }
            totalFiles += soundFiles.length;
            if (soundFiles.length === 0) {
                checkDone();
            }
            soundFiles.forEach((file) => {
                this.#preloadSound(path.join(this.#path.sounds, file), audioContext, (data) => {
                    if (data) {
                        this.#sounds_buffer[file.replace(/\.\w+$/, "")] = data;
                    }
                    loadedFiles++;
                    checkDone();
                });
            });
        });

        fs.readdir(this.#path.voices, (err, voiceFiles) => {
            if (err) {
                return this.emit("sounds.load.error", { "type": "dir.read", "error": err });
            }
            totalFiles += voiceFiles.length;
            if (voiceFiles.length === 0) {
                checkDone();
            }
            voiceFiles.forEach((file) => {
                this.#preloadSound(path.join(this.#path.voices, file), audioContext, (data) => {
                    if (data) {
                        this.#voices_buffer[file.replace(/\.\w+$/, "")] = data;
                    }
                    loadedFiles++;
                    checkDone();
                });
            });
        });
    }

    getSounds() {
        return Object.keys(this.#sounds_buffer)
    }
    getVoices() {
        return Object.keys(this.#voices_buffer)
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
    #preloadSound(path, audioContext, callback) {
        fs.readFile(path, (err, data) => {
            if (err) {
                this.emit("sound.preload.error", { "type": "file.read", "error": err })
                return callback(false)
            }
            const audioData = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);

            audioContext.decodeAudioData(audioData, (buffer) => {
                return callback(buffer)
            }, (err) => {
                this.emit("sound.preload.error", { "type": "audioContext.decodeAudioData", "error": err })
                return callback(false)
            });
        })
    }
    playSound(name, finish, important) {
        if (this.#sounds_buffer[name] || this.#voices_buffer[name]) {
            if (this.soundPlaying == 0) {
                const v = this.spotify.getVolume()
                if (v) {
                    this.lastSpotifyVolume = v
                    this.spotify.setVolume(important ? v / 3 : v / 1.5)
                }
            }
            this.soundPlaying++
            const audioContext = new AudioContext();
            const source = audioContext.createBufferSource();
            // const gainNode = audioContext.createGain();
            source.addEventListener("ended", (ev) => {
                finish && finish(ev)
                this.soundPlaying--
                if (this.soundPlaying <= 0) {
                    this.soundPlaying = 0
                    this.spotify.setVolume(this.lastSpotifyVolume)
                    this.lastSpotifyVolume = null
                }
            })
            source.buffer = this.#sounds_buffer[name] || this.#voices_buffer[name];
            source.connect(audioContext.destination);
            source.start();
        }
    }

    async tts(text, finish, important) {
        if (this.soundPlaying == 0) {
            // this.spotify.player.getVolume().then(v => {
            //     this.lastSpotifyVolume = v
            //     this.spotify.player.setVolume(important ? v / 8 : v / 3)
            // })
        }
        const [response] = await this.ttsClient.synthesizeSpeech({
            input: { text: text },
            // Select the language and SSML voice gender (optional)
            voice: { languageCode: 'fr-FR', ssmlGender: 'FEMALE' },
            // select the type of audio encoding
            audioConfig: { audioEncoding: 'MP3' },
        });
        const audioContext = new AudioContext();
        const source = audioContext.createBufferSource();
        source.addEventListener("ended", (ev) => {
            finish && finish(ev)
            this.soundPlaying--
            if (this.soundPlaying <= 0) {
                this.soundPlaying = 0
                // this.spotify.player.setVolume(this.lastSpotifyVolume)
                this.lastSpotifyVolume = null
            }
        })

        const data = response.audioContent
        const audioData = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
        audioContext.decodeAudioData(audioData, (buffer) => {
            console.log("ee");

            source.buffer = buffer
            source.connect(audioContext.destination);
            source.start();
        }, (err) => {
            console.error(err)
        });
    }
    scanQRCode(canvas, video, cb) {
        let ctx = canvas.getContext("2d")
        let theStream;
        let interval;
        let stopScan = () => {
            clearInterval(interval)
            video?.pause()
            theStream?.getTracks().forEach(function (track) {
                track.stop();
            });
        }
        navigator.mediaDevices.getUserMedia({ audio: false, video: true }).then((stream) => {
            theStream = stream
            video.srcObject = stream
            video.play()
            let data;
            interval = setInterval(() => {
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                if (canvas.width > 0) {
                    data = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height) || data
                    if (data) {
                        stopScan()
                        setTimeout(() => {
                            cb(data.data, data)
                        }, 500);
                    }
                }
            }, 5);
        })
        return stopScan
    }
    get soundsList() {
        return Object.keys(this.#sounds_buffer)
    }
    get datagraphPath() {
        return this.#path.datagraph
    }
}


module.exports = MediaLoader