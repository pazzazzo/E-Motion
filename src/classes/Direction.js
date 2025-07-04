const MediaLoader = require("./MediaLoader");
const turf = require("@turf/turf")

class Direction {
    constructor(mediaLoader = new MediaLoader()) {
        console.log("✅ Direction class invoked");
        this.mediaLoader = mediaLoader
        this.isInRoute = false
        this.route = null
        this.currentStep = 0;
        this.userOffset = 0
        this.mainDirImg = document.getElementById("main-dir-img")
        this.mainDirLanes = document.getElementById("main-dir-lanes")
        this.mainDirStep = document.getElementById("main-dir-step")
        this.mainDirDistance = document.getElementById("main-dir-distance")
        this.mainDirUnit = document.getElementById("main-dir-unit")
        this.mediaLoader.position.coords.on("update", () => {
            if (this.isInRoute) {
                const currentPoint = turf.point(this.mediaLoader.position.coords.array);
                const snapped = turf.nearestPointOnLine(this.line, currentPoint, { units: 'kilometers' })
                const distanceAlong = snapped.properties.location;

                const endCoord = this.line.geometry.coordinates[this.line.geometry.coordinates.length - 1]
                const endPoint = turf.point(endCoord)
                const afterLine = turf.lineSlice(snapped, endPoint, this.line)
                this.routeData.setData(afterLine)

                if (this.route !== null) {
                    this.updateStep(distanceAlong)
                }
            }
        })
        ipcRenderer.on("control.ok", (event, pressed) => {
            if (pressed && this.isInRoute) {
                const currentPoint = turf.point(this.mediaLoader.position.coords.array);
                const snapped = turf.nearestPointOnLine(this.line, currentPoint, { units: 'kilometers' })
                const distanceAlong = snapped.properties.location;

                if (this.route !== null) {
                    this.updateStep(distanceAlong)
                    this.currentStep++
                }
            }
        })
    }
    relativeAngle(bearing, incoming) {
        let diff = (incoming - bearing);
        if (diff < 0) {
            diff += 360
        }
        diff = diff % 360
        return diff
    }
    formatDistance(distance) {
        if (distance < 1000) {
            return [Math.floor(distance), "m"]
        } else {
            return [Math.floor(distance / 100) / 10, "km"]
        }
    }
    turnText(relAngle) {
        const ref = Math.round(relAngle / 90)

        switch (ref) {
            case 0:
                return "backward";
            case 1:
                return "right"
            case 2:
                return "straight"
            case 3:
                return "left"
            default:
                break;
        }
    }
    updateStep(dist) {
        let step = this.route.legs[0].steps[this.currentStep]
        if (this.currentStep === 0 && step.maneuver.type === "depart") {
            this.currentStep++;
            step = this.route.legs[0].steps[this.currentStep]

        }

        console.log(step.maneuver.instruction, step.distance - (dist * 1000));
        this.mainDirStep.innerHTML = `<p>${step.name || step.ref}</p>`
        let distance = this.formatDistance(step.distance - (dist * 1000))
        this.mainDirDistance.innerHTML = distance[0]
        this.mainDirUnit.innerHTML = distance[1]
        let inter = step.intersections[0]
        if (step.maneuver.type == "end of road") {
            step.maneuver.type = "turn"
        }
        step.maneuver.type = step.maneuver.type.replaceAll(" ", "_")
        step.maneuver.modifier = step.maneuver.modifier.replaceAll(" ", "_")
        this.mainDirImg.src = `./media/images/dirs/direction_${step.maneuver.type}_${step.maneuver.modifier}.png`
        // console.log(inter);
        let db = inter.bearings[inter.in]
        this.mainDirLanes.innerHTML = ""
        let dirs = inter.bearings.map((b, i) => {
            if (inter.entry[i]) {
                let angle = this.relativeAngle(b, db)
                let dir = this.turnText(angle)
                if (dir == "backward") return;
                return { text: dir, angle, correct: i == inter.out }
            }
        })
        dirs = dirs.filter(v => v !== undefined).sort((o1, o2) => o2.angle - o1.angle)
        console.log(dirs);

        dirs.forEach((d) => {
            this.mainDirLanes.innerHTML += `<img class="main-dir-lane${d.correct ? " correct" : ""}" src="./media/images/dirs/direction_turn_${d.text}.png">`
        })
    }
    async setMap(dest) {
        this.isInRoute = true
        let [route, coordinates] = await this.getRoute(dest)
        this.line = route
        const currentPoint = turf.point(this.mediaLoader.position.coords.array);
        const snapped = turf.nearestPointOnLine(this.line, currentPoint, { units: 'kilometers' })
        this.userOffset = snapped.properties.location;

        this.route.legs[0].steps.forEach(s => {
            let inter = s.intersections[0]
            let txt = ""

            let db = inter.bearings[inter.in]
            inter.bearings.forEach((b, i) => {
                if (inter.entry[i]) {
                    let angle = this.relativeAngle(b, db)
                    let dir = this.turnText(angle)
                    if (i == inter.out) {
                        txt += `<strong>${dir}, ${angle}</strong><br>`
                    } else {
                        txt += `${dir}, ${angle}<br>`
                    }
                }
            })
            // const popup = new mapboxgl.Popup().setHTML("<p>" + txt + "</p>")
            // new mapboxgl.Marker({}).setLngLat(inter.location).addTo(this.mediaLoader.map).setPopup(popup)
        })

        if (this.mediaLoader.map.getSource('route')) {
            this.mediaLoader.map.getSource('route').setData(route);
            console.log("route already exist");

        } else {
            this.mediaLoader.map.addSource("route", {
                type: 'geojson',
                data: route,
                lineMetrics: true
            })
            this.routeData = mediaLoader.map.getSource("route")
            this.mediaLoader.map.addLayer({
                id: 'route',
                type: 'line',
                source: "route",
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    // 'line-color': '#3b27ff',
                    'line-width': 10,
                    'line-opacity': 0.75,
                    "line-color": ["get", "color"],
                    "line-blur": 0,
                    "line-gap-width": 0
                }
            });
        }

        // Create a 'LngLatBounds' with both corners at the first coordinate.
        const bounds = new mapboxgl.LngLatBounds(
            coordinates[0],
            coordinates[0]
        );

        // Extend the 'LngLatBounds' to include every coordinate in the bounds result.
        for (const coord of coordinates) {
            bounds.extend(coord);
        }

        this.mediaLoader.mapboxCamera.fitBounds(bounds)
    }
    async getRoute(dest) {
        return new Promise(async (resolve) => {
            let userLocation = this.mediaLoader.position.coords
            let url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${userLocation.longitude}%2C${userLocation.latitude}%3B${dest.longitude}%2C${dest.latitude}?alternatives=false&annotations=duration,congestion,maxspeed&geometries=geojson&notifications=all&language=fr&overview=full&steps=true&access_token=${mediaLoader.database.data["mapbox-token"]}`
            console.log(url);


            try {
                const response = await fetch(url);
                const json = await response.json();
                console.log(json);
                const data = json.routes[0];
                this.route = data
                if (data.legs[0].incidents) {
                    console.log(data.legs[0].incidents);
                }
                const coordinates = data.geometry.coordinates;
                const lineSegments = {
                    "type": "Feature",
                    "geometry": {
                        "type": "LineString",
                        "coordinates": coordinates
                    },
                    "properties": {
                        "color": this.mediaLoader.settings.data.map.color.route.basic
                    }
                }

                resolve([lineSegments, coordinates]);
            } catch (error) {
                console.error("Error retrieving addresses :", error);
                resolve({});
            }
        });
    }
    getDistance(coordinates) {
        return new Promise(async (resolve) => {
            let userLocation = this.mediaLoader.position.coords
            let url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${userLocation.longitude}%2C${userLocation.latitude}%3B${coordinates[0]}%2C${coordinates[1]}?alternatives=false&annotations=distance&access_token=${mediaLoader.database.data["mapbox-token"]}`
            console.log(url);


            try {
                const response = await fetch(url);
                const json = await response.json();
                console.log(json);

                let distance = Math.floor(json.routes[0].distance)
                let res = {}
                if (distance > 1000) {
                    res.m = distance % 1000
                    res.km = (distance - res.m) / 1000
                } else {
                    res.m = distance
                }
                resolve(res)
            } catch (error) {
                console.error("Error retrieving addresses :", error);
                resolve({});
            }
        });
    }
}

module.exports = Direction