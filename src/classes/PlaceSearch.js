const MediaLoader = require("./MediaLoader");

class PlaceSearch {
    constructor(mediaLoader = new MediaLoader()) {
        console.log("✅ PlaceSearch class invoked");
        this.mediaLoader = mediaLoader
    }
    init(cb) {
        google.maps.importLibrary("places").then(v => {
            this.Place = v.Place
            cb()
        })
    }
    searchName(name, cb, settings = {}) {
        const request = {
            textQuery: name,
            fields: ["displayName", "location", "businessStatus", "formattedAddress", "rating", "photos"],
            // includedType: "restaurant",
            locationBias: { lat: this.mediaLoader.position.coords.latitude, lng: this.mediaLoader.position.coords.longitude },
            // isOpenNow: true,
            language: "fr-FR",
            maxResultCount: settings.max || 8,
            // minRating: 3.2,
            // region: "fr",
            useStrictTypeFiltering: false,
          };
          this.Place.searchByText(request).then(({places}) => {
            cb(places)
          })
    }
}

module.exports = PlaceSearch