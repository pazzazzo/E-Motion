const Page = require("./Page")
const Keyboard = require("./Keyboard")
const MediaLoader = require("./MediaLoader")

class SearchAddress {
    constructor(mediaLoader = new MediaLoader()) {
        console.log("✅ SearchAddress class invoked");
        this.searchBtn = document.getElementById("main-search")
        this.searchInp = document.getElementById("search-address")
        this.searchSug = document.getElementById("search-suggest")

        this.searchView = document.getElementById("search-view")
        this.searchSuggestions = []
        this.mediaLoader = mediaLoader

        this.searchBtn.addEventListener("click", () => {
            mediaLoader.page.view.show("search")
            this.keyboard = new Keyboard()
            this.keyboard.on("change", (value) => {
                this.searchInp.value = value
                this.autocompleteAddress(value).then(v => {
                    this.searchSuggestions = v
                    this.searchSug.innerHTML = ""
                    v.forEach((p, i) => {
                        this.searchSug.innerHTML += `<div class="search-suggest" onClick=mediaLoader.searchAddress.onClick(${i})><div class="search-pin"><span class="material-symbols-outlined">location_on</span></div><div class="search-result"><div class="search-address">${p.name}</div><div class="search-place">${p.place}</div></div></div>`
                    })
                })
            })
            this.keyboard.show()
        })
        this.searchView.addEventListener("click", () => {
            this.close()
        })
    }
    async autocompleteAddress(query) {
        if (!query.trim()) return [];

        return new Promise(async (resolve) => {
            let url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(query)}&access_token=${mediaLoader.database.data["mapbox-token"]}&autocomplete=true&country=FR&limit=10&types=address,street`;

            // Ajoute la proximité si on a la localisation
            url += `&proximity=${this.mediaLoader.position.coords.longitude},${this.mediaLoader.position.coords.latitude}`;

            try {
                const response = await fetch(url);
                const data = await response.json();

                if (data.message) throw new Error(data.message);

                resolve(
                    (data.features || []).map(feature => ({
                        name: feature.properties.name,
                        place: feature.properties.context.place.name,
                        longitude: feature.properties.coordinates.longitude,
                        latitude: feature.properties.coordinates.latitude,
                        // data: feature
                    }))
                );
            } catch (error) {
                console.error("Erreur lors de la récupération des adresses :", error);
                resolve([]);
            }
        });
    }
    close() {
        mediaLoader.page.view.hide("search")
        this.searchInp.value = ""
        this.searchSug.innerHTML = ""
        this.searchSuggestions = []
        this.keyboard && this.keyboard.hide()
        this.keyboard && this.keyboard.stop()
        this.keyboard = undefined
    }
    onClick(id) {
        console.log(this.searchSuggestions[id]);
        this.mediaLoader.direction.setMap(this.searchSuggestions[id])
        this.mediaLoader.playSound(this.mediaLoader.settings.data.sound.mapGo)
        this.close()
    }
}

module.exports = SearchAddress