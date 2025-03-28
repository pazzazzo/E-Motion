const EventEmitter = require('events');
const SpotifyWebApi = require('spotify-web-api-node');
const MediaLoader = require('./MediaLoader');


class SpotifyClient extends EventEmitter {
    #token;
    constructor(mediaLoader = new MediaLoader()) {
        super()
        console.log("✅ Spotify class invoked");
        this.mediaLoader = mediaLoader
    }
    init(cb = () => { }) {
        console.log("✅ Spotify class init");
        this.connected = false;
        this.spotifyApi = new SpotifyWebApi({
            clientId: "068bfc52df2f4fd5aecdd639ee6265de",
            clientSecret: this.mediaLoader.database.data["spotify-secret"],
            redirectUri: "http://localhost:8888/callback"
        });
        this.HTML = {
            main: document.getElementById("main-music"),
            img: document.getElementById("main-music-image"),
            title: document.getElementById("main-music-title"),
            artist: document.getElementById("main-music-artist"),
            previous: document.getElementById("data-music-previous"),
            play: document.getElementById("data-music-pause"),
            next: document.getElementById("data-music-next"),
        }
        this.duration = 0
        this.current = 0
        this.paused = true
        this.interval;

        this.HTML.previous.addEventListener("click", () => {
            if (this.connected) {
                if (this.current > 3000) {
                    this.player.seek(0)
                } else {
                    this.player.previousTrack()
                }
            }
        })
        this.HTML.play.addEventListener("click", () => {
            if (this.connected) {
                this.player.togglePlay()
            }
        })
        this.HTML.next.addEventListener("click", () => {
            if (this.connected) {
                this.player.nextTrack()
            }
        })

        cb()
    }
    connect() {
        return new Promise((r, e) => {
            this.spotifyApi.setRefreshToken(this.mediaLoader.database.data["spotify-refresh-token"])
            this.player = new Spotify.Player({
                name: this.mediaLoader.settings.data.machine.name,
                getOAuthToken: cb => {
                    this.connected = false
                    this.spotifyApi.refreshAccessToken().then((data) => {
                        cb(data.body['access_token']);
                        this.#token = data.body['access_token']
                        console.log('The access token has been refreshed!');
                        this.spotifyApi.setAccessToken(data.body['access_token']);
                        this.connected = true
                    }).catch(e => {
                        console.error(e);
                    })
                }
            });
            this.player.addListener("ready", ({ device_id }) => {
                // fetch("https://api.spotify.com/v1/me/player", {
                //     method: "PUT",
                //     headers: {
                //         "Authorization": `Bearer ${this.#token}`,
                //         "Content-Type": "application/json"
                //     },
                //     body: JSON.stringify({
                //         device_ids: [device_id],
                //         play: true
                //     })
                // });
                this.emit("ready", device_id)
            })
            this.player.addListener("player_state_changed", state => {
                console.log(state);

                if (state) {
                    this.duration = state.duration
                    this.current = state.position
                    let percentage = Math.floor((state.position / state.duration) * 100)
                    this.paused = state.paused
                    this.HTML.main.style.background = `linear-gradient(90deg, #494c5b ${percentage - 1}%, #191a1e ${percentage}%)`
                    if (state.track_window && state.track_window.current_track) {
                        this.HTML.img.src = state.track_window.current_track.album.images[0].url
                        this.HTML.title.innerHTML = state.track_window.current_track.name
                        this.HTML.artist.innerHTML = state.track_window.current_track.artists[0].name
                    }
                    if (state.paused && this.interval) {
                        clearInterval(this.interval)
                        this.interval = undefined
                    } else {
                        if (this.interval) {
                            clearInterval(this.interval)
                        }
                        this.interval = setInterval(() => {
                            this.current += 1000
                            let percentage = Math.floor((this.current / this.duration) * 10000) / 100
                            this.HTML.main.style.background = `linear-gradient(90deg, #494c5b ${percentage - 1}%, #191a1e ${percentage}%)`
                        }, 1000);
                    }
                    this.HTML.play.children[0].innerHTML = state.paused ? "play_arrow" : "pause"
                }

                this.emit("player.state", state)
            });
            this.player.connect()
            r()
        }, (err) => {
            e(err)
        });
    }
    getCurrentTrack() {
        return new Promise((r, e) => {
            if (!this.connected) {
                return e("User not connected")
            }
            this.spotifyApi.getMyCurrentPlayingTrack().then(v => {
                r(v.body.item)
            })
        })
    }
}

module.exports = SpotifyClient