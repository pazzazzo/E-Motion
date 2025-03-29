const MediaLoader = require("./MediaLoader");

class Direction {
    constructor(mediaLoader = new MediaLoader()) {
        console.log("✅ Direction class invoked");
        this.mediaLoader = mediaLoader
    }
    async setMap(dest) {
        let [route, coordinates] = await this.getRoute(dest)
        if (this.mediaLoader.map.getSource('route')) {
            this.mediaLoader.map.getSource('route').setData(route);
        } else {
            this.mediaLoader.map.addLayer({
                id: 'route',
                type: 'line',
                source: {
                    type: 'geojson',
                    data: route
                },
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
            let url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${userLocation.longitude}%2C${userLocation.latitude}%3B${dest.longitude}%2C${dest.latitude}?alternatives=false&annotations=duration,congestion,maxspeed&geometries=geojson&notifications=all&language=fr&overview=full&steps=true&&access_token=${mediaLoader.database.data["mapbox-token"]}`
            console.log(url);


            try {
                const response = await fetch(url);
                const json = await response.json();
                console.log(json);
                const data = json.routes[0];
                data.legs[0].steps.forEach((step, index) => {
                    // console.log(step.maneuver.instruction);


                    // if (step.intersections) {
                    //     step.intersections.forEach(intersection => {
                    //         console.log(step.maneuver.instruction, step.maneuver.modifier, intersection);
                    //         new mapboxgl.Marker({ color: "red" })
                    //                         .setLngLat(intersection.location)
                    //                         .addTo(this.mediaLoader.map);
                    //     })
                    // }

                    // if (step.intersections) {
                    //     console.log(`🚦 Intersection ${index + 1} - Instruction: ${step.maneuver.instruction}`);
            
                    //     step.intersections.forEach((intersection, i) => {
                    //         if (intersection.lanes) {
                    //             let possibleLanes = intersection.lanes
                    //                 .filter(lane => lane.valid) // Garde les voies valides
                    //                 .map(lane => lane.indications.join(", ")); // Affiche les directions
            
                    //             console.log(`  🔹 Options: ${possibleLanes.join(" | ")}`);
                    //         }
                    //     });
            
                    //     console.log(`  ✅ Chemin à suivre: ${step.maneuver.modifier}`);
                    // }

                });
                if (data.legs[0].incidents) {
                    console.log(data.legs[0].incidents);
                }

                const coordinates = data.geometry.coordinates;
                const congestionLevels = data.legs[0].annotation.congestion;
                const lineSegments = {
                    type: 'FeatureCollection',
                    features: [
                    ]
                }

                lineSegments.features.push({
                    "type": "Feature",
                    "geometry": {
                        "type": "LineString",
                        "coordinates": coordinates
                    },
                    "properties": {
                        "color": this.mediaLoader.settings.data.map.color.route.basic
                    }
                });

                lineSegments.features.push({
                    "type": "Feature",
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [[-0.567932, 44.830082],
                        [-0.567317, 44.829965],
                        [-0.567229, 44.829957],
                        [-0.56713, 44.830048],
                        [-0.566983, 44.830392],
                        [-0.566865, 44.830677],
                        [-0.567497, 44.830815],
                        [-0.567617, 44.830842],
                        [-0.567745, 44.83087],
                        [-0.56808, 44.830946],
                        [-0.568169, 44.830947],
                        [-0.568253, 44.830909],
                        [-0.568301, 44.830807],
                        [-0.568482, 44.83036],
                        [-0.568499, 44.830285],
                        [-0.568486, 44.830236],
                        [-0.568412, 44.830186],
                        [-0.567932, 44.830082]]
                    },
                    "properties": {
                        "color": this.mediaLoader.settings.data.map.color.route.basic
                    }
                });

                for (let i = 0; i < coordinates.length - 1; i++) {
                    const congestion = congestionLevels[i];

                    let color
                    if (congestion === "moderate") color = this.mediaLoader.settings.data.map.color.route.traffic;
                    else if (congestion === "heavy") color = this.mediaLoader.settings.data.map.color.route.heavyTraffic;

                    if (color) {
                        lineSegments.features.push({
                            "type": "Feature",
                            "geometry": {
                                "type": "LineString",
                                "coordinates": [coordinates[i], coordinates[i + 1]]
                            },
                            "properties": {
                                "color": color
                            }
                        });
                    }
                }


                resolve([lineSegments, coordinates]);
            } catch (error) {
                console.error("Erreur lors de la récupération des adresses :", error);
                resolve({});
            }
        });
    }
}

module.exports = Direction