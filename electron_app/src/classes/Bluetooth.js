const dbus = require('dbus-next');
const { EventEmitter } = require("events");


class Bluetooth extends EventEmitter {
    constructor() {
        console.log("✅ Bluetooth class invoked");
        super()
        this.ofonoService = "org.ofono"
        this.bluezService = "org.bluez"
        this.objectManagerInterface = "org.freedesktop.DBus.ObjectManager"
        this.agentManagerInterface = "org.bluez.AgentManager1"
        this.managerPath = "/"
        this.bluezManagerPath = "/org/bluez"
        this.systemBus = dbus.systemBus();
        this.sessionBus = dbus.sessionBus()
    }
    async init() {
        try {
            this.ofonoProxyObject = await this.systemBus.getProxyObject(this.ofonoService, this.managerPath);
            this.ofonoManager = this.ofonoProxyObject.getInterface(this.ofonoService + '.Manager');
            this.ofonoModem = await this.ofonoManager.GetModems();
            this.handleOfonoInterface()
            this.bluezProxyObject = await this.systemBus.getProxyObject(this.bluezService, this.managerPath);
            this.bluezManager = this.bluezProxyObject.getInterface(this.objectManagerInterface);
            this.bluezManager.on('InterfacesAdded', (path, interfaces) => {
                if (interfaces['org.bluez.MediaPlayer1']) {
                    this.playerPath = path;
                    this.handleBluezInterface();
                    this.handleOfonoInterface()
                }
            });

            this.bluezObjects = await this.bluezManager.GetManagedObjects();
            for (const path of Object.keys(this.bluezObjects)) {
                if (this.bluezObjects[path]['org.bluez.MediaPlayer1']) {
                    this.playerPath = path;
                    break;
                }
            }
            if (!this.playerPath) {
                console.error('Aucun lecteur Bluetooth (MediaPlayer1) trouvé.');
            } else {
                this.handleBluezInterface();
            }

            this.agentManagerProxy = await this.systemBus.getProxyObject(this.bluezService, this.bluezManagerPath);
            this.agentManager = this.agentManagerProxy.getInterface(this.agentManagerInterface);
        } catch (error) {
            console.error("Error initializing Bluetooth :", error);
        }
    }
    formatTime(ms) {
        const totalSec = Math.floor(ms / 1000);
        const hours = Math.floor(totalSec / 3600);
        const minutes = Math.floor((totalSec % 3600) / 60);
        const seconds = totalSec % 60;
        if (hours > 0) {
            return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        } else {
            return `${minutes}:${String(seconds).padStart(2, '0')}`;
        }
    }
    async handleOfonoInterface() {
        if (this.ofonoModem.length === 0) {
            console.error("No modem detected. Please check your ofono configuration and phone pairing.");
        } else {
            console.log("Available modems :");
            this.ofonoModem.forEach(([path, properties]) => {
                console.log(`- ${path}`);
            });

            this.ofonoModemPath = this.ofonoModem[0][0];
            console.log(`Used modem : ${this.ofonoModemPath}`);

            this.modemProxy = await this.systemBus.getProxyObject(this.ofonoService, this.ofonoModemPath);
            console.log("Interfaces on the modem:", Object.keys(this.modemProxy.interfaces).join(', '));
            try {
                this.callManager = this.modemProxy.getInterface('org.ofono.VoiceCallManager');
                this.callManager.on('CallAdded', async (callPath, properties) => {
                    // Extraire quelques informations de l'appel
                    const number = properties['LineIdentification']?.value || "Inconnu";
                    const state = properties['State']?.value || "unknown state";
                    console.log(`New call detected: ${number} (state: ${state})`);
                    this.emit("voicecall.start", { number, state })

                    try {
                        let callProxy = await this.systemBus.getProxyObject(this.ofonoService, callPath);
                        this.voiceCall = callProxy.getInterface('org.ofono.VoiceCall');
                    } catch (err) {
                        console.error("Error processing the call: ", err);
                    }
                    mediaLoader.spotify.pause()
                });

                this.callManager.on('CallRemoved', (callPath, properties) => {
                    console.log(`Call ended or disconnected: ${callPath}`);
                    this.voiceCall = null
                    this.emit("voicecall.end")
                    mediaLoader.spotify.play()
                });

                console.log("Waiting for call events...");
            } catch (err) {
                console.error("The VoiceCallManager interface is not available on this modem.", err);
            }
        }
    }
    async handleBluezInterface() {
        console.log("Bluetooth player found: ", this.playerPath);
        this.playerProxy = await this.systemBus.getProxyObject(this.bluezService, this.playerPath);
        this.playerInterface = this.playerProxy.getInterface('org.freedesktop.DBus.Properties');
        this.playerManager = this.playerProxy.getInterface('org.bluez.MediaPlayer1');

        console.log("Interfaces on the modem:", Object.keys(this.playerProxy.interfaces).join(', '));
        this.playerInterface.on('PropertiesChanged', (iface, changed) => {
            if (iface === 'org.bluez.MediaPlayer1') {
                this.handleTrack(changed);
            }
        });
        const allProps = await this.playerInterface.GetAll('org.bluez.MediaPlayer1');
        this.handleTrack(allProps);
    }
    handleTrack(changed) {
        if (changed.Track) {
            const track = changed.Track.value;
            const title = track.Title.value;
            const artist = track.Artist.value;
            const durationMs = track.Duration.value;
            this.emit("bluetooth.track", {
                name: title,
                artist: artist,
                duration: durationMs
            })
            const query = encodeURIComponent(`${artist} ${title}`);
            const apiUrl = `https://itunes.apple.com/search?term=${query}&limit=1&media=music`;
            fetch(apiUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error ${response.status} – ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(body => {
                    if (!body.results || body.results.length === 0) {
                        this.emit("bluetooth.cover", null);
                        return;
                    }
                    const artUrl = body.results[0].artworkUrl100.replace(/100x100/, "600x600");
                    this.emit("bluetooth.cover", artUrl);
                })
                .catch(err => {
                    console.error("Erreur lors de la requête :", err);
                    this.emit("bluetooth.cover", null);
                });
        }
        if (changed.Status) {
            this.emit("bluetooth.status", changed.Status.value)
        }
        if (changed.Position) {
            this.emit("bluetooth.position", changed.Position.value)
        }
        if (changed.Name) {
            console.log(`Nom du lecteur : ${changed.Name.value}`);
        }
    }
    callDial(number) {
        if (this.callManager) {
            this.callManager.Dial(number, "")
        }
    }
    async callAnswer() {
        if (this.voiceCall) {
            await this.voiceCall.Answer()
        }
    }
    async callHangup() {
        if (this.voiceCall) {
            await this.voiceCall.Hangup();
        }
    }
    musicPlay() {
        if (this.playerManager) {
            this.playerManager.Play();
        } else {
            console.error("Bluetooth player found.");
        }
    }
    musicPause() {
        if (this.playerManager) {
            this.playerManager.Pause();
        } else {
            console.error("Bluetooth player found.");
        }
    }
    musicStop() {
        if (this.playerManager) {
            this.playerManager.Stop();
        } else {
            console.error("Bluetooth player found.");
        }
    }
    musicNext() {
        if (this.playerManager) {
            this.playerManager.Next();
        } else {
            console.error("Bluetooth player found.");
        }
    }
    musicPrevious() {
        if (this.playerManager) {
            this.playerManager.Previous();
        } else {
            console.error("Bluetooth player found.");
        }
    }
    musicSeek(position) {
        if (this.playerManager) {
            this.playerManager.Seek(position);
        } else {
            console.error("Bluetooth player found.");
        }
    }
    musicVolume(volume) {
        if (this.playerManager) {
            this.playerManager.SetVolume(volume);
        } else {
            console.error("Bluetooth player found.");
        }
    }
    musicMute() {
        if (this.playerManager) {
            this.playerManager.Mute();
        } else {
            console.error("Bluetooth player found.");
        }
    }
    musicUnmute() {
        if (this.playerManager) {
            this.playerManager.Unmute();
        } else {
            console.error("Bluetooth player found.");
        }
    }
}


module.exports = Bluetooth