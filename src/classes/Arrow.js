const path = require("path");
const MediaLoader = require("./MediaLoader");
const MapboxObject = require("./MapboxObject");

class Arrow extends MapboxObject {
    constructor(mediaLoader = new MediaLoader()) {
        super(mediaLoader, path.join(__dirname, "..", "media/images/arrow.png"))
        console.log("✅ Arrow class invoked");
        this.update(mediaLoader.position.coords.array, mediaLoader.position.coords.heading)
        mediaLoader.position.coords.on("update", () => {
            this.update(mediaLoader.position.coords.array, mediaLoader.position.coords.heading)
        })
    }
}

module.exports = Arrow