const Settings = require("./Settings");

class Sound {
    constructor(settings = new Settings()) {
        console.log("✅ SettingsApp-Sound class invoked");
        this.settings = settings
        this.sonControls = document.getElementsByClassName("settings-event-sound")
        this.sonPreview = document.getElementsByClassName("settings-event-sound-play")
        this.voiceControl = document.getElementById("settings-event-voice")
        this.mainVolume = document.getElementById("settings-event-volume")
        this.muted = document.getElementById("settings-event-muted")
        this.controls = {
            "mapGo": this.sonControls[0],
            "mapArrived": this.sonControls[1],
            "mapTraffic": this.sonControls[2],
            "usbConnected": this.sonControls[3],
            "usbDisconnected": this.sonControls[4],
        }
        this.spotifyControl = {
            "autoConnect": document.getElementById("settings-spotify-autoconnect"),
            "connectDelay": document.getElementById("settings-spotify-connectdelay"),
            "connectNotify": document.getElementById("settings-spotify-connectnotify"),
        }

        this.spotifyControl.autoConnect.checked = mediaLoader.settings.data.spotify.autoConnect;
        this.spotifyControl.connectDelay.value = mediaLoader.settings.data.spotify.connectDelay;
        this.spotifyControl.connectNotify.checked = mediaLoader.settings.data.spotify.connectNotify;

        this.mainVolume.value = mediaLoader.settings.data.sound.mainVolume
        this.mainVolume.addEventListener("change", (e) => {
            mediaLoader.settings.data.sound.mainVolume = e.target.value;
            // mediaLoader.setVolume(e.target.value);
        })
        this.muted.checked = mediaLoader.settings.data.sound.muted
        this.muted.addEventListener("change", (e) => {
            mediaLoader.settings.data.sound.muted = e.target.checked;
            // mediaLoader.setMuted(e.target.checked);
        })


        for (const controlId in this.controls) {
            let el = this.controls[controlId]
            mediaLoader.getSounds().forEach((sound) => {
                el.innerHTML += `<option value="${sound}" ${mediaLoader.settings.data.sound[controlId] === sound ? "selected" : ""}>${sound}</option>`
            })
            el.addEventListener("change", (e) => {
                mediaLoader.settings.data.sound[controlId] = e.target.value;
            })
        }

        mediaLoader.getVoices().forEach((sound) => {
            this.voiceControl.innerHTML += `<option value="${sound}" ${mediaLoader.settings.data.ai.voice === sound ? "selected" : ""}>${sound}</option>`
        })
        for (let i = 0; i < this.sonPreview.length; i++) {
            const element = this.sonPreview[i];
            element.addEventListener("click", () => {
                element.innerHTML = `<span class="material-symbols-outlined">pause</span>`
                mediaLoader.playSound(this.sonControls[i]?.value || this.voiceControl.value, () => {
                    element.innerHTML = `<span class="material-symbols-outlined">play_arrow</span>`
                }, this.sonControls[i] ? false : true)
            })
        }
    }
}

module.exports = Sound