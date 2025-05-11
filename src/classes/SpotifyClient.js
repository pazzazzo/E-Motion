const EventEmitter = require('events');
const SpotifyWebApi = require('spotify-web-api-node');
const MediaLoader = require('./MediaLoader');
const { ipcRenderer } = require('electron');


class SpotifyClient extends EventEmitter {
    #token;
    constructor(mediaLoader = new MediaLoader()) {
        super()
        console.log("✅ Spotify class invoked");
        this.mediaLoader = mediaLoader
        this.webApi = new SpotifyWebApi()
    }
    init(cb = () => { }) {
        console.log("✅ Spotify class init");
        this.connected = false;
        this.connecting = false;
        this.synced = false;
        this.clientId = "65b708073fc0480ea92a077233ca87bd"
        this.currentState;
        cb()
    }
    connect() {
        if (this.connected || this.connecting) {
            return
        }
        this.connecting = true
        return new Promise(async (r, e) => {
            const token = await this.refreshAccessToken(this.mediaLoader.database.data["spotify-refresh-token"])
            console.log(token);

            if (token.access_token) {
                ipcRenderer.send("spotify.start", {
                    "name": this.mediaLoader.settings.data.machine.name,
                    "token": token.access_token
                })
                this.webApi.setAccessToken(token.access_token)
                this._updateCurrentState()
                this.mediaLoader.database.data["spotify-refresh-token"] = token.refresh_token
                this.#token = token
                this.connected = true
                console.log('The access token has been refreshed!', token.access_token);
                this.mediaLoader.database.save()

            } else {
                this.connected = false
                this.connecting = false
            }
            r()
        });
    }
    _updateCurrentState() {
        this.webApi.getMyCurrentPlaybackState().then(d => {
            this.currentState = d.body
            setTimeout(() => {
                this._updateCurrentState()
            }, 1000);
        }).catch(e => {
            console.error(e);
            setTimeout(() => {
                this._updateCurrentState()
            }, 1000);
        })
    }
    getVolume() {
        return this.currentState?.device?.volume_percent
    }
    setVolume(percent) {
        this.webApi.setVolume(percent)
    }
    async oauthAuthorize() {
        const params = new URLSearchParams({
            client_id: this.clientId,
            creation_point: `https://login.app.spotify.com/?client_id=${this.clientId}&utm_source=spotify&utm_medium=desktop-win32&utm_campaign=organic`,
            intent: 'login',
            scope: [
                'app-remote-control',
                'playlist-modify',
                'playlist-modify-private',
                'playlist-modify-public',
                'playlist-read',
                'playlist-read-collaborative',
                'playlist-read-private',
                'streaming',
                'ugc-image-upload',
                'user-follow-modify',
                'user-follow-read',
                'user-library-modify',
                'user-library-read',
                'user-modify',
                'user-modify-playback-state',
                'user-modify-private',
                'user-personalized',
                'user-read-birthdate',
                'user-read-currently-playing',
                'user-read-email',
                'user-read-play-history',
                'user-read-playback-position',
                'user-read-playback-state',
                'user-read-private',
                'user-read-recently-played',
                'user-top-read',
            ].join(','),
        });

        const DEVICE_AUTHORIZE_URL = 'https://accounts.spotify.com/oauth2/device/authorize';
        const res = await fetch(DEVICE_AUTHORIZE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Spotify/125700463 Win32_x86_64/0 (CarThing)',
                'Accept-Language': 'en-Latn-US,en-US;q=0.9',
            },
            body: params.toString(),
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Device auth failed (${res.status}): ${err}`);
        }

        return res.json();
    }

    async checkAuthStatus(deviceCode) {
        const params = new URLSearchParams({
            client_id: this.clientId,
            device_code: deviceCode,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        });

        const TOKEN_URL = 'https://accounts.spotify.com/api/token';
        const res = await fetch(TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });

        // 400 + error=authorization_pending means keep polling
        if (res.status === 400) {
            const body = await res.json();
            if (body.error === 'authorization_pending') {
                return {};
            }
            throw new Error(body.error_description || body.error);
        }

        if (!res.ok) {
            throw new Error(`Token poll failed (${res.status})`);
        }

        return res.json();
    }
    async refreshAccessToken(refreshToken) {
        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: this.clientId,
        });

        const TOKEN_URL = 'https://accounts.spotify.com/api/token';
        const res = await fetch(TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Refresh failed (${res.status}): ${err}`);
        }

        return res.json();
    }
    playHere() {
        fetch("https://api.spotify.com/v1/me/player", {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${this.#token.access_token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                device_ids: [device_id],
                play: true
            })
        });
    }
}

module.exports = SpotifyClient