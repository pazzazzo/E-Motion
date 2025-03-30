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
        ]
        this.nav = [
            document.getElementById("settings-list-nav"),
            document.getElementById("settings-list-map"),
            document.getElementById("settings-list-sound"),
            document.getElementById("settings-list-notifications"),
            document.getElementById("settings-list-system"),
        ]

        this.controls = {
            "nav": {},
            "map": {
                normalColor: document.getElementById("normal-map-color"),
                trafficColor: document.getElementById("traffic-map-color"),
                heavyColor: document.getElementById("heavy-map-color"),
            },
        }

        this.controls.map.normalColor.value = this.mediaLoader.settings.data.map.color.route.basic;
        this.controls.map.trafficColor.value = this.mediaLoader.settings.data.map.color.route.traffic;
        this.controls.map.heavyColor.value = this.mediaLoader.settings.data.map.color.route.heavyTraffic;
        
        this.nav.forEach((el, index) => {
            el.addEventListener("click", () => {
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
    }
}

module.exports = Settings