const Navbar = require("./Navbar.js");
const Maps = require("./Maps.js");
const Sound = require("./Sound.js");
const Alerts = require("./Alerts.js");
const Camera = require("./Camera.js");
const SIM = require("./SIM.js");
const System = require("./System.js");
const EventEmitter = require("events");

class Settings extends EventEmitter {
    constructor() {
        console.log("✅ SettingsApp invoked");
        super()
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
            this.emit("modal.close", this.currentModal)
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