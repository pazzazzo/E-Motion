const MediaLoader = require("../../classes/MediaLoader");
class Settings {
    constructor(mediaLoader = new MediaLoader()) {
        console.log("✅ Settings app invoked");
        this.mediaLoader = mediaLoader;
    }
    init() {
        console.log("app init");
        this.cards = [
            [document.getElementById("settings-nav")],
            [document.getElementById("settings-map")],
            [document.getElementById("settings-sound"), document.getElementById("settings-spotify")],
            [],
            [document.getElementById("settings-cam-select"), document.getElementById("settings-cams-select"), document.getElementById("settings-record")],
            [document.getElementById("settings-account"), document.getElementById("settings-services"), document.getElementById("settings-updates")],
        ]

        this.currentModal = null;
        this.modalScreen = document.getElementById("settings-modal-screen")
        this.modalScreen.addEventListener("click", (ME) => {
            if (ME.target == this.modalScreen) {
                this.closeModal()
            }
        })
        this.modals = {
            "update": document.getElementById("settings-modal-update"),
            "spotify-load": document.getElementById("settings-modal-spotify-load")
        }
        this.modalsButtons = document.getElementsByClassName("settings-modal-button")
        for (let i = 0; i < this.modalsButtons.length; i++) {
            const btn = this.modalsButtons[i];
            btn.addEventListener("click", () => {
                this.modalClick(btn.dataset.action)
            })
        }
        document.getElementById("settings-updates-download").addEventListener("click", () => {
            this.openModal("update")
        })
        this.titles = [
            "Personalisation de la barre de navigation",
            "Paramètres de la carte",
            "Paramètres sonores",
            "Paramètres des alertes",
            "Paramètres des caméras",
            "Paramètres système",
        ]
        this.title = document.getElementById("settings-type")
        this.nav = [
            document.getElementById("settings-list-nav"),
            document.getElementById("settings-list-map"),
            document.getElementById("settings-list-sound"),
            document.getElementById("settings-list-notifications"),
            document.getElementById("settings-list-camera"),
            document.getElementById("settings-list-system"),
        ]
        let sonControls = document.getElementsByClassName("settings-event-sound")
        let sonPreview = document.getElementsByClassName("settings-event-sound-play")
        let camerasSelect = document.getElementsByClassName("settings-cams-selector")
        let camerasPreview = document.getElementsByClassName("settings-cams-preview")
        this.controls = {
            "nav": {},
            "map": {
                color: {
                    normal: document.getElementById("normal-map-color"),
                    traffic: document.getElementById("traffic-map-color"),
                    heavy: document.getElementById("heavy-map-color"),
                },
                style: {
                    standard: document.getElementById("map-style-standard"),
                    dark: document.getElementById("map-style-dark"),
                    satellite: document.getElementById("map-style-satellite"),
                    terrain: document.getElementById("map-style-terrain"),
                },
                "update-frequency": {
                    "15": document.getElementById("update-frequency-15"),
                    "30": document.getElementById("update-frequency-30"),
                    "60": document.getElementById("update-frequency-60"),
                    "300": document.getElementById("update-frequency-300"),
                },
            },
            "sounds": {
                "mapGo": sonControls[0],
                "mapArrived": sonControls[1],
                "mapTraffic": sonControls[2],
                "usbConnected": sonControls[3],
                "usbDisconnected": sonControls[4]
            },
            "spotify": {
                "autoConnect": document.getElementById("settings-spotify-autoconnect"),
                "connectDelay": document.getElementById("settings-spotify-connectdelay"),
                "connectNotify": document.getElementById("settings-spotify-connectnotify"),
            },
            "camerasSelecors": {
                "dashcam": camerasSelect[0],
                "front": camerasSelect[1],
                "back": camerasSelect[2],
            }
        }

        this.controls.map.color.normal.value = this.mediaLoader.settings.data.map.color.route.basic;
        this.controls.map.color.traffic.value = this.mediaLoader.settings.data.map.color.route.traffic;
        this.controls.map.color.heavy.value = this.mediaLoader.settings.data.map.color.route.heavyTraffic;
        this.controls.map.style[this.mediaLoader.settings.data.map.style].checked = true;
        this.controls.map["update-frequency"][this.mediaLoader.settings.data.map.updateFrequency].selected = true;
        for (const controlId in this.controls.sounds) {
            let el = this.controls.sounds[controlId]
            this.mediaLoader.getSounds().forEach((sound) => {
                el.innerHTML += `<option value="${sound}" ${this.mediaLoader.settings.data.sound[controlId] === sound ? "selected" : ""}>${sound}</option>`
            })
        }
        for (let i = 0; i < sonPreview.length - 1; i++) {
            const element = sonPreview[i];
            element.addEventListener("click", () => {
                element.innerHTML = `<span class="material-symbols-outlined">pause</span>`
                this.mediaLoader.playSound(sonControls[i].value, () => {
                    element.innerHTML = `<span class="material-symbols-outlined">play_arrow</span>`
                })
            })
        }
        this.controls.spotify.autoConnect.checked = this.mediaLoader.settings.data.spotify.autoConnect;
        this.controls.spotify.connectDelay.value = this.mediaLoader.settings.data.spotify.connectDelay;
        this.controls.spotify.connectNotify.checked = this.mediaLoader.settings.data.spotify.connectNotify;
        document.getElementById("settings-spotify-connect").addEventListener("click", () => {
            this.spotifyConnect()
        })

        //Récupérer toutes les caméras du navigateur et les ajouter à la liste
        navigator.mediaDevices.enumerateDevices().then((devices) => {
            devices.forEach((device) => {
                if (device.kind === "videoinput") {
                    for (const deviceType in this.controls.camerasSelecors) {
                        let option = document.createElement("option");
                        option.value = device.deviceId;
                        option.innerHTML = device.label;
                        if (device.deviceId === this.mediaLoader.settings.data.camera.device[deviceType]) {
                            option.selected = true;
                        }
                        this.controls.camerasSelecors[deviceType].appendChild(option);
                    }
                }
            })
        })

        for (let i = 0; i < camerasSelect.length; i++) {
            const element = camerasSelect[i];
            element.addEventListener("change", () => {
                let camId = element.value;
                if (camId == "null") {
                    return camerasPreview[i].srcObject = null;
                }

                navigator.mediaDevices.getUserMedia({
                    video: {
                        deviceId: { exact: camId }
                    }
                }).then((stream) => {
                    let video = camerasPreview[i];
                    video.srcObject = stream;
                    video.play();
                }).catch((err) => {
                    console.error(err);
                })
            })
        }


        this.nav.forEach((el, index) => {
            el.addEventListener("click", () => {
                this.title.innerHTML = this.titles[index];
                this.cards.forEach((cards, cardIndex) => {
                    cards.forEach((el) => {
                        el.classList.remove("active");
                    });
                    this.nav[cardIndex].classList.remove("selected");
                    if (cardIndex === index) {
                        cards.forEach((el) => {
                            el.classList.add("active");
                        });
                    }
                });
                el.classList.add("selected");
            });
        });
    }
    onShow() {
        console.log("app show");
    }
    onClose() {
        console.log("app close");
        // this.closeModal()
    }
    spotifyConnect() {
        this.openModal("spotify-load")
    }
    openModal(modalId) {
        this.closeModal()
        this.currentModal = modalId
        this.modalScreen.classList.remove("hidden");
        this.modals[modalId].classList.add("active");
    }
    closeModal() {
        if (this.currentModal) {
            this.modals[this.currentModal].classList.remove("active");
            this.modalScreen.classList.add("hidden");
        }
    }
    modalClick(action) {
        if (action == "cancel") {
            this.closeModal()
        }
        if (this.currentModal == "update") {
            if (action == "ok") {
                this.closeModal()
            }
        }
    }
}

module.exports = Settings