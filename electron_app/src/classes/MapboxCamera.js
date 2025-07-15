const Arrow = require("./Arrow");
const MapboxObject = require("./MapboxObject");
const MediaLoader = require("./MediaLoader");

class MapboxCamera {
    constructor() {
        console.log("✅ MapboxCamera class invoked");
        this.followedObject = null;
        this.followCallback = (coordinates, bearing) => {
            let b = new mapboxgl.LngLat(...coordinates)
            mediaLoader.map.fitBounds(b.toBounds(1), {
                duration: 1500,
                // speed: .5,
                easing: (t) => t,
                bearing,
                pitch: 45,
                maxZoom: 18
            }, {
                tracking: true
            })
            // mediaLoader.map.flyTo({
            //     duration: 1500,
            //     // speed: .5,
            //     easing: (t) => t,
            //     center: coordinates,
            //     bearing,
            //     zoom: 18
            // }, {
            //     tracking: true
            // })
        }
        this.recenterBtn = document.getElementById("main-recenter")
        this.recenterBtn.addEventListener("click", () => {
            this.followUser()
        })
        mediaLoader.map.on("movestart", (e) => {
            if (e.originalEvent) {
                this.stopFollow()
            }
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
        if (this.followedObject) {
            this.stopFollow()
        }
        // if (options.zoom) {
        //     let zoom = options.zoom
        //     delete options.zoom
        //     setTimeout(() => {
        //         mediaLoader.map.zoomTo(zoom, {
        //             duration: 5000,
        //         })
        //     }, 1000);
        // }
        let opt = {
            duration: 3000,
            center: object.coordinates,
            bearing: object.bearing,
            essential: true
        }

        if (options) {
            opt = { ...opt, ...options }
        }
        mediaLoader.map.flyTo(opt)
        this.followedObject = object
        if (this.isFollowUser()) {
            this.recenterBtn.classList.add("hidden")
        } else {
            this.recenterBtn.classList.remove("hidden")
        }
        object.onUpdate(this.followCallback)
    }
    stopFollow() {
        if (this.followedObject) {
            this.followedObject.offUpdate()
            if (this.isFollowUser()) {
                this.recenterBtn.classList.remove("hidden")
            }
        }
        this.followedObject = null
    }
    fitBounds(bounds) {
        this.stopFollow()
        mediaLoader.map.fitBounds(bounds, {
            padding: 200
        });
    }
}

module.exports = MapboxCamera