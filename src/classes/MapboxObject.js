const { EventEmitter } = require("events");
const MediaLoader = require("./MediaLoader");

class MapboxObject extends EventEmitter {
    constructor(mediaLoader = new MediaLoader(), imgPath) {
        super()
        this.coordinates = mediaLoader.position.coords.array
        this.bearing = 90
        this.marker = null;
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
        this.emit("update", this.coordinates, this.bearing)
    }
    updateBearing(bearing) {
        this.bearing = bearing
        this.marker && this.marker.setRotation(bearing)
        this.emit("update", this.coordinates, this.bearing)
    }
    update(coords, bearing) {
        this.updateCoords(coords)
        this.updateBearing(bearing)
    }
}

module.exports = MapboxObject