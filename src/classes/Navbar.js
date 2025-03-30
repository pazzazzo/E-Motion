const MediaLoader = require("./MediaLoader");
const path = require("path")
const fs = require("fs")

class Navbar {
    constructor(mediaLoader = new MediaLoader()) {
        console.log("✅ Navbar class invoked");
        this.mediaLoader = mediaLoader
        this.buttons = {
            "home": document.getElementById("menu-home"),
            // "spotify": document.getElementById("menu-music"),
            // "youtube": document.getElementById("menu-ytb"),
            "phone": document.getElementById("menu-phone")
        }

        this.buttons.home.addEventListener("click", () => {
            this.mediaLoader.appLoader.appChange("home")
        })
        /*
            <div class="menu-icon" id="menu-phone">
                <img class="" src="./media/images/phone-icon.png">
            </div>
            box-shadow: 0px 0px 0px 2px #08c98f;
        */
        // this.buttons.spotify.addEventListener("click", () => {
        //     mediaLoader.page.view.change("music")
        // })
        // this.buttons.youtube.addEventListener("click", () => {
        //     mediaLoader.page.view.change("youtube")
        // })
        // this.buttons.phone.addEventListener("click", () => {
        //     mediaLoader.page.view.change("main")
        // })
    }
    postInit() {
        this.navBarHTML = document.getElementById("menu-bar")
        this.appsHTML = document.getElementById("apps-view")
        if (this.mediaLoader.settings.data["navbar"] && this.mediaLoader.settings.data["navbar"].length) {
            this.mediaLoader.settings.data["navbar"].forEach(nav => {
                if (this.mediaLoader.apps.has(nav.id)) {
                    let appPath = this.mediaLoader.apps.get(nav.id)
                    let manifest = require(path.join(appPath, "manifest.json"))
                    let iconPath = nav.icon || manifest["default-icon"]
                    let color = nav.color || manifest["default-color"]
                    if (iconPath.startsWith("hydix:")) {
                        iconPath = iconPath.replace("hydix:", path.join(__dirname, "..", "media", "images") + "/") + ".png"
                    } else {
                        iconPath = path.join(appPath, iconPath)
                    }

                    let element = document.createElement("div")
                    element.classList.add("menu-icon")
                    element.id = `menu-${nav.id}`
                    element.style.boxShadow = `0px 0px 0px 2px ${color}`
                    element.innerHTML = `<img class="" src="${iconPath}">`
                    element.addEventListener("click", () => {
                        this.mediaLoader.appLoader.appChange(nav.id)
                    })
                    this.navBarHTML.appendChild(element)
                }
            });
        }
    }
}

module.exports = Navbar