class PlaceSearch {
    constructor() {
        console.log("✅ PlaceSearch class invoked");
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
            locationBias: { lat: mediaLoader.position.coords.latitude, lng: mediaLoader.position.coords.longitude },
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