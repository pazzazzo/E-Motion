const MediaLoader = require("./MediaLoader");

class Navbar {
    constructor(mediaLoader = new MediaLoader()) {
        this.buttons = {
            "home": document.getElementById("menu-home"),
            // "spotify": document.getElementById("menu-music"),
            // "youtube": document.getElementById("menu-ytb"),
            "phone": document.getElementById("menu-phone")
        }

        this.buttons.home.addEventListener("click", () => {
            mediaLoader.page.view.change("main")
        })
        // this.buttons.spotify.addEventListener("click", () => {
        //     mediaLoader.page.view.change("music")
        // })
        // this.buttons.youtube.addEventListener("click", () => {
        //     mediaLoader.page.view.change("youtube")
        // })
        this.buttons.phone.addEventListener("click", () => {
            mediaLoader.page.view.change("main")
        })
    }
}

module.exports = Navbar