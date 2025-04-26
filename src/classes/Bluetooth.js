const MediaLoader = require("./MediaLoader");
const dbus = require('dbus-next');
const { spawn } = require("child_process");
const { EventEmitter } = require("events");
const request = require('request');


class Bluetooth extends EventEmitter {
    constructor(mediaLoader = new MediaLoader()) {
        console.log("✅ Bluetooth class invoked");
        super()
        this.mediaLoader = mediaLoader
        this.ofonoService = "org.ofono"
        this.bluezService = "org.bluez"
        this.objectManagerInterface = "org.freedesktop.DBus.ObjectManager"
        this.managerPath = "/"
        this.systemBus = dbus.systemBus();
        this.sessionBus = dbus.sessionBus()
    }
    async init() {
        try {
            this.ofonoProxyObject = await this.systemBus.getProxyObject(this.ofonoService, this.managerPath);
            this.ofonoManager = this.ofonoProxyObject.getInterface(this.ofonoService + '.Manager');
            this.ofonoModem = await this.ofonoManager.GetModems();
            if (this.ofonoModem.length === 0) {
                console.error("Aucun modem détecté. Vérifiez la configuration d'ofono et l'appairage de votre téléphone.");
            } else {
                console.log("Modems disponibles :");
                this.ofonoModem.forEach(([path, properties]) => {
                    console.log(`- ${path}`);
                });

                this.ofonoModemPath = this.ofonoModem[0][0];
                console.log(`Utilisation du modem : ${this.ofonoModemPath}`);

                this.modemProxy = await this.systemBus.getProxyObject(this.ofonoService, this.ofonoModemPath);
                console.log("Interfaces sur le modem :", Object.keys(this.modemProxy.interfaces).join(', '));
                try {
                    this.callManager = this.modemProxy.getInterface('org.ofono.VoiceCallManager');
                    this.callManager.on('CallAdded', async (callPath, properties) => {
                        // Extraire quelques informations de l'appel
                        const number = properties['LineIdentification']?.value || "Inconnu";
                        const state = properties['State']?.value || "état inconnu";
                        console.log(`Nouvel appel détecté : ${number} (état: ${state})`);
                        this.emit("voicecall.start", { number, state })

                        try {
                            let callProxy = await this.systemBus.getProxyObject(this.ofonoService, callPath);
                            this.voiceCall = callProxy.getInterface('org.ofono.VoiceCall');
                        } catch (err) {
                            console.error("Erreur lors du traitement de l'appel :", err);
                        }
                    });

                    this.callManager.on('CallRemoved', (callPath, properties) => {
                        console.log(`Appel terminé ou retiré : ${callPath}`);
                        this.voiceCall = null
                        this.emit("voicecall.end")
                    });

                    console.log("En attente d'événements d'appel...");
                } catch (err) {
                    console.error("L'interface VoiceCallManager n'est pas disponible sur ce modem.");
                }
            }
            this.bluezProxyObject = await this.systemBus.getProxyObject(this.bluezService, this.managerPath);
            this.bluezManager = this.bluezProxyObject.getInterface(this.objectManagerInterface);
            this.bluezManager.on('InterfacesAdded', (path, interfaces) => {
                if (interfaces['org.bluez.MediaPlayer1']) {
                    this.handleBluezInterface(path);
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
                this.handleBluezInterface(this.playerPath);
            }
        } catch (error) {
            console.error("Erreur lors de l'initialisation bluetooth :", error);
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
    async handleBluezInterface(path) {
        console.log("Lecteur Bluetooth trouvé :", this.playerPath);
        this.playerPath = path;
        this.playerProxy = await this.systemBus.getProxyObject(this.bluezService, this.playerPath);
        this.playerInterface = this.playerProxy.getInterface('org.freedesktop.DBus.Properties');
        this.playerManager = this.playerProxy.getInterface('org.bluez.MediaPlayer1');
        
        console.log("Interfaces sur le modem :", Object.keys(this.playerProxy.interfaces).join(', '));
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
            request({ url: apiUrl, json: true, proxy: 'http://127.0.0.1:3128' }, (err, resp, body) => {
                if (err || !body.results || body.results.length === 0) {
                    console.error('Pas de pochette trouvée.');
                    this.emit("bluetooth.cover", null)
                    return;
                }
                const artUrl = body.results[0].artworkUrl100.replace(/100x100/, '600x600');
                this.emit("bluetooth.cover", artUrl)
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
            console.error("Aucun lecteur Bluetooth trouvé.");
        }
    }
    musicPause() {
        if (this.playerManager) {
            this.playerManager.Pause();
        } else {
            console.error("Aucun lecteur Bluetooth trouvé.");
        }
    }
    musicStop() {
        if (this.playerManager) {
            this.playerManager.Stop();
        } else {
            console.error("Aucun lecteur Bluetooth trouvé.");
        }
    }
    musicNext() {
        if (this.playerManager) {
            this.playerManager.Next();
        } else {
            console.error("Aucun lecteur Bluetooth trouvé.");
        }
    }
    musicPrevious() {
        if (this.playerManager) {
            this.playerManager.Previous();
        } else {
            console.error("Aucun lecteur Bluetooth trouvé.");
        }
    }
    musicSeek(position) {
        if (this.playerManager) {
            this.playerManager.Seek(position);
        } else {
            console.error("Aucun lecteur Bluetooth trouvé.");
        }
    }
    musicVolume(volume) {
        if (this.playerManager) {
            this.playerManager.SetVolume(volume);
        } else {
            console.error("Aucun lecteur Bluetooth trouvé.");
        }
    }
    musicMute() {
        if (this.playerManager) {
            this.playerManager.Mute();
        } else {
            console.error("Aucun lecteur Bluetooth trouvé.");
        }
    }
    musicUnmute() {
        if (this.playerManager) {
            this.playerManager.Unmute();
        } else {
            console.error("Aucun lecteur Bluetooth trouvé.");
        }
    }
}


module.exports = Bluetooth