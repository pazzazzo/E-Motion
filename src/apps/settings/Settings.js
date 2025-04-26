const Chart = require("../../classes/Chart.js");
const MediaLoader = require("../../classes/MediaLoader");
const fs = require("fs");
const Navbar = require("./Navbar.js");
const Maps = require("./Maps.js");
const Sound = require("./Sound.js");
const Alerts = require("./Alerts.js");
const Camera = require("./Camera.js");
const SIM = require("./SIM.js");
const System = require("./System.js");

class Settings {
    constructor(mediaLoader = new MediaLoader()) {
        console.log("✅ SettingsApp invoked");
        this.mediaLoader = mediaLoader;
    }
    init() {
        console.log("✅ SettingsApp init");
        this.cards = [
            {
                "elements": [[document.getElementById("settings-nav")]],
                "sub": 0,
                "title": "Personalisation de la barre de navigation",
            },
            {
                "elements": [[document.getElementById("settings-map")]],
                "sub": 0,
                "title": "Paramètres de la carte",
            },
            {
                "elements": [[document.getElementById("settings-sound"), document.getElementById("settings-spotify")]],
                "sub": 0,
                "title": "Paramètres sonores",
            },
            {
                "elements": [[]],
                "sub": 0,
                "title": "Paramètres des alertes",
            },
            {
                "elements": [[document.getElementById("settings-cams-select"), document.getElementById("settings-record")], []],
                "sub": 0,
                "selector": document.getElementById("settings-cam-select"),
                "title": "Paramètres des caméras",
            },
            {
                "elements": [[document.getElementById("settings-sim-conso")], []],
                "sub": 0,
                "selector": document.getElementById("settings-sim-select"),
                "title": "Paramètres de la carte SIM",
            },
            {
                "elements": [[document.getElementById("settings-account"), document.getElementById("settings-services"), document.getElementById("settings-updates")]],
                "sub": 0,
                "title": "Paramètres système",
            },
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
        this.title = document.getElementById("settings-type")
        this.nav = [
            document.getElementById("settings-list-nav"),
            document.getElementById("settings-list-map"),
            document.getElementById("settings-list-sound"),
            document.getElementById("settings-list-notifications"),
            document.getElementById("settings-list-camera"),
            document.getElementById("settings-list-sim"),
            document.getElementById("settings-list-system"),
        ]
        let camerasSelect = document.getElementsByClassName("settings-cams-selector")
        let camerasPreview = document.getElementsByClassName("settings-cams-preview")
        this.controls = {
            "camerasSelecors": {
                "dashcam": camerasSelect[0],
                "front": camerasSelect[1],
                "back": camerasSelect[2],
            }
        }
        this.simChart = new Chart(document.getElementById("settings-sim-use-chart").getContext("2d"), {
            unit: " MB",
        })
        this.simChart.addStat(this.mediaLoader.stats.dataUse, {
            type: "getDatasetsByDatesNumber", args: [new Date(), -13], params: {
                label: "Utilisation",
                rounded: true,
                fill: true
            },
            convertCallback: ((data) => Math.round(data / 1024 / 1024)),
        })
        const typeData = [
            2.00,   // audio-ak.spotifycdn.com: 2 096 684 / 1 048 576 ≈ 2.00 Mo
            0.68,   // web-sdk-assets.spotifycdn.com: 710 420 / 1 048 576 ≈ 0.68 Mo
            0.30,   // i.scdn.co: 315 065 / 1 048 576 ≈ 0.30 Mo
            0.30,   // api.mapbox.com: 312 446 / 1 048 576 ≈ 0.30 Mo
            0.23,   // www.waze.com: 242 388 / 1 048 576 ≈ 0.23 Mo
            0.03,   // api.wit.ai: 36 560 / 1 048 576 ≈ 0.03 Mo
            0.03,   // cpapi.spotify.com: 35 212 / 1 048 576 ≈ 0.03 Mo
            0.03,   // places.googleapis.com: 31 144 / 1 048 576 ≈ 0.03 Mo
            0.03,   // api.spotify.com: 28 208 / 1 048 576 ≈ 0.03 Mo
            0.02,   // gew1-dealer.spotify.com: 25 354 / 1 048 576 ≈ 0.02 Mo
            0.01,   // seektables.scdn.co: 10 149 / 1 048 576 ≈ 0.01 Mo
            0.01,   // events.mapbox.com: 8 894 / 1 048 576 ≈ 0.01 Mo
            0.01,   // maps.googleapis.com: 8 389 / 1 048 576 ≈ 0.01 Mo
            0.01    // apresolve.spotify.com: 7 063 / 1 048 576 ≈ 0.01 Mo
        ]
        const typeLabels = [
            "audio-ak.spotifycdn.com",
            "web-sdk-assets.spotifycdn.com",
            "i.scdn.co",
            "api.mapbox.com",
            "www.waze.com",
            "api.wit.ai",
            "cpapi.spotify.com",
            "places.googleapis.com",
            "api.spotify.com",
            "gew1-dealer.spotify.com",
            "seektables.scdn.co",
            "events.mapbox.com",
            "maps.googleapis.com",
            "apresolve.spotify.com"
        ]
        this.typeChart = new Chart(document.getElementById("settings-sim-type-chart").getContext("2d"), {
            x: typeLabels,
            y: [
                {
                    data: typeData,
                    label: "Utilisation",
                    rounded: true,
                    fill: true
                }
            ],
            unit: " MB",
            type: "bar",
            horizontal: true,
            height: `${2 * typeLabels.length}rem`
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
                this.cards.forEach((cards, cardIndex) => {
                    if (cards.selector) {
                        cards.selector.classList.remove("active")
                    }
                    cards.elements.forEach((row) => {
                        row.forEach(el => {
                            el.classList.remove("active");
                        })
                    });
                    this.nav[cardIndex].classList.remove("selected");
                    if (cardIndex === index) {
                        if (cards.selector) {
                            cards.selector.classList.add("active")
                        }
                        this.title.innerHTML = cards.title
                        let row = cards.elements[cards.sub]
                        row.forEach(el => {
                            el.classList.add("active");
                        })
                    }
                });
                el.classList.add("selected");
            });
        });
        this.cards.forEach((cards, cardIndex) => {
            if (cards.selector) {
                for (let i = 0; i < cards.selector.children.length; i++) {
                    const node = cards.selector.children[i];
                    node.addEventListener("click", () => {
                        cards.elements.forEach((row, rowi) => {
                            if (rowi == i) {
                                row.forEach(el => {
                                    el.classList.add("active")
                                })
                            } else {
                                row.forEach(el => {
                                    el.classList.remove("active")
                                })
                            }
                        })
                        cards.selector.children[cards.sub].classList.remove("active")
                        cards.sub = i
                        node.classList.add("active")
                    })
                }
            }
        });

        this.navbar = new Navbar(this)
        this.maps = new Maps(this)
        this.sound = new Sound(this)
        this.alerts = new Alerts(this)
        this.camera = new Camera(this)
        this.sim = new SIM(this)
        this.system = new System(this)
    }
    onShow() {
        console.log("app show");
    }
    onClose() {
        console.log("app close");
        // this.closeModal()
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