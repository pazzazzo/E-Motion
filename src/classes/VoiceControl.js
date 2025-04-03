const MediaLoader = require("./MediaLoader");
const request = require('request')
const recorder = require("./recorder")

class VoiceControl {
    constructor(mediaLoader = new MediaLoader()) {
        console.log("✅ VoiceControl class invoked");
        this.mediaLoader = mediaLoader
        this.animationFrameID = null;
        this.placesList = document.getElementById("main-places")
        this.waypointsList = new Set()
        this.placesElementList = new Set()
        this.selectedPlace = null
        this.clickNum = 0;
        this.mic = document.getElementById("menu-voice")
        this.mic.style.background = `linear-gradient(41deg, #14d289 13%, #0f57ff 48%, #ea0b59 99%);`
        this.mic.addEventListener("click", async () => {
            if (this.animationFrameID) return;
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            const audioContext = new AudioContext();
            const mediaStreamAudioSourceNode = audioContext.createMediaStreamSource(stream);
            const analyserNode = audioContext.createAnalyser();
            mediaStreamAudioSourceNode.connect(analyserNode);
            const pcmData = new Float32Array(analyserNode.fftSize);
            const onFrame = () => {
                analyserNode.getFloatTimeDomainData(pcmData);
                let sumSquares = 0.0;
                for (const amplitude of pcmData) { sumSquares += amplitude * amplitude; }
                let v = (Math.sqrt(sumSquares / pcmData.length) * 100)
                this.mic.style.boxShadow = `0px 0px ${v * 1.2}px 1px rgba(98, 243, 103, 0.78) inset`
                // console.log(v);

                this.mic.style.height = `${65 + v}px`
                this.mic.style.width = `${65 + v}px`

                this.animationFrameID = window.requestAnimationFrame(onFrame);
            };
            this.animationFrameID = window.requestAnimationFrame(onFrame);

            const parseResult = (err, resp, body) => {
                if (err) return console.error(err);
                let json = JSON.parse(body)
                console.log("rep", err, resp, body);
                
                if (json.outcomes?.length) {
                    let res = json.outcomes[0]
                    if (res.entities?.waypoint_name?.length) {
                        let placeName = res.entities.waypoint_name[0].value
                        mediaLoader.placeSearch.searchName(placeName, (places) => {
                            this.clearWaypoints()
                            this.clickNum = 0;
                            this.selectedPlace = null;
                            const bounds = new mapboxgl.LngLatBounds(
                                ...places.map(p => [p.location.lng(), p.location.lat()])
                            );
                            places.forEach(async (place) => {
                                console.log(`Nom: ${place.displayName}\nAdresse: ${place.formattedAddress}`);
                                let dist = await this.mediaLoader.direction.getDistance([place.location.lng(), place.location.lat()])
                                const placeElement = document.createElement("div");
                                placeElement.className = "main-place";
                                placeElement.addEventListener("click", () => {
                                    mediaLoader.direction.setMap({
                                        longitude: place.location.lng(),
                                        latitude: place.location.lat()
                                    })
                                    if (this.selectedPlace !== placeElement) {
                                        this.clickNum = 1
                                    } else {
                                        this.clickNum++
                                    }
                                    this.selectedPlace = placeElement
                                    if (this.clickNum == 1) {
                                        let i = -1
                                        this.placesElementList.forEach((m) => {
                                            i++
                                            if (m !== placeElement) {
                                                m.classList.add("back")
                                                m.classList.remove("selected")
                                            } else {
                                                m.classList.remove("back")
                                                m.classList.add("selected")
                                                this.placesList.classList.add("selected")


                                                this.placesList.style.setProperty("--pointer", `${(i*this.placesList.clientHeight/4) + this.placesList.clientHeight/8}px`)
                                            }
                                        })
                                    } else {
                                        this.clearWaypoints()
                                        this.placesList.classList.remove("selected")
                                    }
                                })
                                this.addWaypoint([place.location.lng(), place.location.lat()], bounds, placeElement)

                                const placeImage = document.createElement("img");
                                placeImage.src = place.photos.length ? place.photos[0].getURI({ maxHeight: 400 }) : "./media/images/placeholder.jpg";
                                placeImage.alt = "Place picture";
                                placeImage.className = "main-place-image";

                                const placeData = document.createElement("div");
                                placeData.className = "main-place-data";

                                const placeTitle = document.createElement("div");
                                placeTitle.className = "main-place-title";
                                placeTitle.textContent = place.displayName;

                                const placeAddress = document.createElement("div");
                                placeAddress.className = "main-place-address";
                                placeAddress.textContent = place.formattedAddress;

                                const placeReview = document.createElement("div");
                                placeReview.className = "main-place-review";
                                placeReview.innerHTML = this.formatReview(place);

                                const placeDistance = document.createElement("div");
                                placeDistance.className = "main-place-distance";
                                placeDistance.innerHTML = `<span>${this.formatDistance(dist)}</span>`;

                                placeData.appendChild(placeTitle);
                                placeData.appendChild(placeAddress);
                                placeData.appendChild(placeReview);

                                placeElement.appendChild(placeImage);
                                placeElement.appendChild(placeData);
                                placeElement.appendChild(placeDistance);

                                this.placesList.appendChild(placeElement);
                            });
                            this.mediaLoader.mapboxCamera.fitBounds(bounds)
                        }, { max: 4 })
                    }
                } else {
                    console.log("no result");
                }
            }

            const recording = recorder.record({
                // recordProgram: "rec",
                silence: 1,
                // threshold: 0.1,
                endOnSilence: true,
                thresholdEnd: 0.1
            })

            recording.stream().pipe(request.post({
                'url': 'https://api.wit.ai/speech?client=chromium&lang=fr-fr&output=json',
                'headers': {
                    'Accept': 'application/vnd.wit.20160202+json',
                    'Authorization': `Bearer ${mediaLoader.database.data["wit-token"]}`,
                    'Content-Type': 'audio/wav'
                }
            }, parseResult))
            recording.stream().once("finish", () => {
                console.log("ok");

                this.mic.style.boxShadow = `0px 0px 0px 1px rgba(0, 0, 0, 0) inset`
                this.mic.style.height = `70px`
                this.mic.style.width = `70px`
                window.cancelAnimationFrame(this.animationFrameID)
                this.animationFrameID = null
                analyserNode.disconnect()
                mediaStreamAudioSourceNode.disconnect()
                audioContext.close()
                stream.getTracks().forEach(function (track) {
                    track.stop();
                });
            })

            setTimeout(() => {
                recording.stop()
            }, 20000)
        })
    }
    formatReview(place) {
        let result = `<span class="material-symbols-outlined filled">star</span>`.repeat(place.reviews[0].rating)
            + `<span class="material-symbols-outlined filled">star</span>`.repeat(5 - place.reviews[0].rating)
        return result
    }
    formatDistance(dist) {
        if (dist.km) {
            return `${dist.km}.${(dist.m - (dist.m % 100)) / 100}km`
        } else {
            return `${dist.m}m`
        }
    }
    clearWaypoints() {
        this.waypointsList.forEach(m => {
            m.remove()
            this.waypointsList.delete(m)
        })
        this.placesElementList.forEach(m => {
            m.remove()
            this.placesElementList.delete(m)
        })
    }
    addWaypoint(coordinates, bounds, placeElement) {
        let m = new mapboxgl.Marker().setLngLat(coordinates)
        m.addTo(mediaLoader.map)
        this.waypointsList.add(m)
        this.placesElementList.add(placeElement)

        // bounds.extend(coordinates);
    }
}

module.exports = VoiceControl