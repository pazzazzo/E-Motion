const MediaLoader = require("./MediaLoader");

class Direction {
    constructor(mediaLoader = new MediaLoader()) {
        this.mediaLoader = mediaLoader
    }
    async setMap(dest) {
        if (this.mediaLoader.map.getSource('route')) {
            this.mediaLoader.map.getSource('route').setData(await this.getRoute(dest));
        } else {
            this.mediaLoader.map.addLayer({
                id: 'route',
                type: 'line',
                source: {
                    type: 'geojson',
                    data: await this.getRoute(dest)
                },
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#3887be',
                    'line-width': 5,
                    'line-opacity': 0.75
                }
            });
        }
    }
    async getRoute(dest) {
        return new Promise(async (resolve) => {
            let userLocation = new Coords()
            let url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation.longitude}%2C${userLocation.latitude}%3B${dest.longitude}%2C${dest.latitude}?alternatives=false&annotations=state_of_charge%2Cduration&geometries=geojson&language=en&overview=full&steps=true&engine=electric&ev_max_charge=6000&ev_connector_types=ccs_combo_type1%2Cccs_combo_type2&energy_consumption_curve=10%2C200%3B20%2C100%3B40%2C120%3B60%2C140%3B80%2C180%3B100%2C220&ev_charging_curve=8000%2C40000%3B16000%2C45000%3B24000%2C46000%3B28000%2C32000%3B32000%2C26000%3B36000%2C20000&ev_max_ac_charging_power=3600&ev_min_charge_at_destination=1000&ev_min_charge_at_charging_station=1000&auxiliary_consumption=3481&access_token=${mediaLoader.database.data["mapbox-token"]}`
            console.log(url);
            
            
            try {
                const response = await fetch(url);
                const json = await response.json();
                console.log(json);

                const data = json.routes[0];
                data.legs[0].steps.forEach(element => {
                    console.log(element.maneuver.instruction);
                    
                });
                
                const route = data.geometry.coordinates;
                const geojson = {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: route
                    }
                }

                resolve(geojson);
            } catch (error) {
                console.error("Erreur lors de la récupération des adresses :", error);
                resolve({});
            }
        });
    }
}

module.exports = Direction