const MediaLoader = require("./MediaLoader");
const path = require("path")
const fs = require("fs")

class AppLoader {
    constructor(mediaLoader = new MediaLoader()) {
        console.log("✅ AppLoader class invoked");
        this.mediaLoader = mediaLoader
        this.classes = new Map()
        this.appsHTML = document.getElementById("apps-view")
        this.actualApp = null

        mediaLoader.apps.forEach((appPath, appId) => {
            let manifest = require(path.join(appPath, "manifest.json"))
            let data = fs.readFileSync(path.join(appPath, (manifest["html"] || "index.html")))
            this.appsHTML.innerHTML += data.toString()
            let AppClass = require(path.join(appPath, manifest["main"]))
            this.classes.set(appId, new AppClass(this.mediaLoader))
            let style = document.createElement("link")
            style.rel = "stylesheet"
            style.href = path.join(appPath, (manifest["css"] || "style.css"))
            style.type = "text/css"
            document.head.appendChild(style)
        })
        this.classes.forEach((app, id) => {
            app.init()
        })
    }
    appChange(app) {
        if (this.actualApp === app || app === "home") {
            if (!this.actualApp) return;
            this.classes.get(this.actualApp).onClose()
            this.mediaLoader.page.apps.close()
            this.actualApp = null
            return
        }
        this.classes.get(app).onShow()
        this.mediaLoader.page.apps.show(app)
        this.actualApp = app
    }
}

module.exports = AppLoader