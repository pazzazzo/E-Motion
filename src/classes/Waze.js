const MediaLoader = require("./MediaLoader")

class Waze {
    constructor() {
        console.log("✅ Waze class invoked");
        this.lastFetches = {}
        this.alertPending = false
        this.pendFetches = new Set()
        this.polices = new Set()
    }
    fetch(bounds, scopes = ["alerts", "users"]) {
        this.alertPending = true
        return new Promise((r, err) => {
            if (this.lastFetches[scopes.join("-")]) {
                return r(this.lastFetches[scopes.join("-")])
            }
            
            fetch(`https://www.waze.com/live-map/api/georss?top=${bounds.getNorth() + 0.01}&bottom=${bounds.getSouth() - 0.01}&left=${bounds.getWest() - 0.01}&right=${bounds.getEast() + 0.01}&env=row&types=${scopes.join(",")}`).then(v => {
                v.json().then(json => {
                    this.lastFetches[scopes.join("-")] = json
                    setTimeout(() => {
                        delete this.lastFetches[scopes.join("-")]
                    }, 3000);
                    this.alertPending = false
                    this.pendFetches.forEach((cb) => {
                        cb(json)
                        this.pendFetches.delete(cb)
                    })
                    r(json)
                })
            }).catch(e => {
                err(e)
            })
        })
    }
    fetchPolice(bounds) {
        const cb = (json) => {
            this.polices.forEach(el => {
                el.remove()
            })
            this.polices.clear()
            let r = {}

            Object.hasOwn(json, "alerts") && json.alerts.forEach(alert => {
                if (alert.type === "POLICE") {
                    // console.log(alert);

                    const marker = new mapboxgl.Marker({
                        element: document.createElement("div"),
                    }).setLngLat([alert.location.x, alert.location.y]).addTo(mediaLoader.map);

                    // Add an image to the element
                    const el = marker.getElement();
                    el.classList.add("map-icon-police")
                    this.polices.add(el)
                }
            });
        }
        if (this.lastFetches["alerts"]) {
            cb(this.lastFetches["alerts"])
        } else if (this.alertPending) {
            this.pendFetches.add(cb)
            
        } else {
            this.fetch(bounds, ["alerts"]).then(json => {
                cb(json)
            }).catch(e => {
                console.error(e);
            })
        }
    }
}

module.exports = Waze