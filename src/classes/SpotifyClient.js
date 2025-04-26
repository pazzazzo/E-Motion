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
        this.synced = false;
        this.spotifyApi = new SpotifyWebApi({
            clientId: "068bfc52df2f4fd5aecdd639ee6265de",
            clientSecret: this.mediaLoader.database.data["spotify-secret"],
            redirectUri: "http://localhost:8888/callback"
        });
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
                if (state) {
                    console.log(state);
                    
                    this.emit("player.state", state)
                }
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