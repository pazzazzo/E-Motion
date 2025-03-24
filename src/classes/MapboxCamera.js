const Arrow = require("./Arrow");
const MapboxObject = require("./MapboxObject");
const MediaLoader = require("./MediaLoader");

class MapboxCamera {
    constructor(mediaLoader = new MediaLoader()) {
        this.followedObject = null;
        this.mediaLoader = mediaLoader
        this.followCallback = (coordinates, bearing) => {
            this.mediaLoader.map.easeTo({
                duration: 1500,
                easing: (t) => t,
                center: coordinates,
                bearing
            })
        }
        this.recenterBtn = document.getElementById("main-recenter")
        this.recenterBtn.addEventListener("click", () => {
            this.followUser()
        })
    }
    isFollowUser() {
        return this.followedObject instanceof Arrow
    }
    followUser() {
        this.followObject(mediaLoader.arrow, {
            zoom: 18,
            maxZoom: 20,
            pitch: 45
        })
    }
    followObject(object, options) {
        if (!(object instanceof MapboxObject)) {
            return console.error("Object is not a MapboxObject !");
        }
        if (this.followObject) {
            this.stopFollow()
        }
        // if (options.zoom) {
        //     let zoom = options.zoom
        //     delete options.zoom
        //     setTimeout(() => {
        //         this.mediaLoader.map.zoomTo(zoom, {
        //             duration: 5000,
        //         })
        //     }, 1000);
        // }
        let opt = {
            duration: 5000,
            center: object.coordinates,
            bearing: object.bearing,
            essential: true
        }

        if (options) {
            opt = { ...opt, ...options }
        }
        this.mediaLoader.map.flyTo(opt)
        this.followedObject = object
        if (this.isFollowUser()) {
            this.recenterBtn.classList.add("hidden")
        } else {
            this.recenterBtn.classList.remove("hidden")
        }
        object.on("update", this.followCallback)

        this.mediaLoader.map.on("movestart", (e) => {
            if (e.originalEvent) {
                console.log(e.originalEvent);
                
                this.stopFollow()
            }
        })
    }
    stopFollow() {
        if (this.followedObject) {
            this.followedObject.off("update", this.followCallback)
            if (this.isFollowUser()) {
                this.recenterBtn.classList.remove("hidden")
            }
        }
        this.followedObject = null
    }
    fitBounds(bounds) {
        this.stopFollow()
        this.mediaLoader.map.fitBounds(bounds, {
            padding: 200
        });
    }
}

module.exports = MapboxCamera