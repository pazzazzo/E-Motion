const { EventEmitter } = require("events");
const MediaLoader = require("./MediaLoader");

class MapboxObject extends EventEmitter {
    constructor(mediaLoader = new MediaLoader(), imgPath) {
        super()
        console.log("✅ MapboxObject class invoked");
        this.coordinates = mediaLoader.position.coords.array
        this.bearing = 90
        this.marker = null;
        this.updateCallback = null;
        let image = new Image()
        image.src = imgPath
        image.addEventListener("load", () => {
            this.marker = new mapboxgl.Marker({
                element: image,
                rotationAlignment: "map",
            }).setLngLat(this.coordinates).setPitchAlignment("map").setRotation(this.bearing).addTo(mediaLoader.map)
            image.style.height = "30px"

        })
    }

    updateCoords(coords) {
        this.coordinates = coords
        this.marker && this.marker.setLngLat(coords)
    }
    updateBearing(bearing) {
        this.bearing = bearing
        this.marker && this.marker.setRotation(bearing)
    }
    update(coords, bearing) {
        this.updateBearing(bearing)
        this.updateCoords(coords)
        if (typeof this.updateCallback == "function") {
            this.updateCallback(this.coordinates, this.bearing)
        }
        // this.emit("update", this.coordinates, this.bearing)
    }
    onUpdate(cb) {
        this.updateCallback = cb
    }
    offUpdate() {
        this.updateCallback = null
    }
}

module.exports = MapboxObject