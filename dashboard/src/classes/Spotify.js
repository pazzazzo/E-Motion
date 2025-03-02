const EventEmitter = require('events');
const SpotifyWebApi = require('spotify-web-api-node');


class Spotify extends EventEmitter {
    constructor(config) {
        super()
        this.config = config
    }
    init(cb = () => { }) {
        this.spotifyApi = new SpotifyWebApi({
            clientId: "068bfc52df2f4fd5aecdd639ee6265de",
            clientSecret: this.config["spotify-secret"],
            redirectUri: "http://localhost:8888/callback"
        });
        this.spotifyApi.setRefreshToken(this.config["spotify-refresh-token"])
        this.spotifyApi.refreshAccessToken().then((data) => {
            console.log('The access token has been refreshed!');
            this.spotifyApi.setAccessToken(data.body['access_token']);
            cb(true)
        }, (err) => {
            cb(false, err)
        });
    }
    getCurrentTrack() {
        return new Promise((r, e) => {
            this.spotifyApi.getMyCurrentPlayingTrack().then(v => {
                r(v.body.item)
            })
        })
    }
}

module.exports = Spotify