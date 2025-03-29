const MediaLoader = require("./MediaLoader");
const request = require('request')
const recorder = require("./recorder")

class VoiceControl {
    constructor(mediaLoader = new MediaLoader()) {
        console.log("✅ VoiceControl class invoked");
        this.mediaLoader = mediaLoader
        this.animationFrameID = null;
        this.placesList = document.getElementById("main-places")
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
                if (json.outcomes?.length) {
                    let res = json.outcomes[0]
                    if (res.entities?.waypoint_name?.length) {
                        let placeName = res.entities.waypoint_name[0].value
                        mediaLoader.placeSearch.searchName(placeName, (places) => {
                            this.placesList.innerHTML = ""
                            places.forEach(place => {
                                console.log(`Nom: ${place.displayName}\nAdresse: ${place.formattedAddress}`);
                                this.placesList.innerHTML += `<div class="main-place">
                            <img src="${place.photos.length ? place.photos[0].getURI({ maxHeight: 400 }) : "./media/images/placeholder.jpg"}" alt="Place picture" class="main-place-image">
                            <div class="main-place-data">
                                <div class="main-place-title">${place.displayName}</div>
                                <div class="main-place-address">${place.formattedAddress}</div>
                                <div class="main-place-review">
                                    ${this.formatReview(place)}
                                </div>
                            </div>
                            <div class="main-place-distance"><span>5.2km</span></div>
                        </div>`
                                place.photos.forEach(photo => {
                                    console.log(photo.getURI({ maxHeight: 400 }));
                                });
                            });
                        }, { max: 4 })
                    }
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
}

module.exports = VoiceControl