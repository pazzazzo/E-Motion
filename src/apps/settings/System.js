const Settings = require("./Settings");
const qr = require("qrcode-terminal")

class System {
    constructor(settings = new Settings()) {
        console.log("✅ SettingsApp-System class invoked");
        this.settings = settings
        this.spotify = mediaLoader.spotify

        this.qrcodeHTML = document.getElementById("spotipair-qr")
        this.linkHTML = document.getElementById("spotipair-link")
        this.codeHTML = document.getElementById("spotipair-code")

        this.spotifyConnecting = false;

        document.getElementById("settings-spotify-connect").addEventListener("click", () => {
            this.spotifyConnect()
        })

        settings.on("modal.close", (modalId) => {
            if (modalId == "spotify-load") {
                this.spotifyConnecting = false
            }
        })
    }

    spotifyConnect() {
        this.settings.openModal("spotify-load")
        this.spotify.oauthAuthorize().then(d => {
            console.log(d);
            qr.generate(d.verification_uri_complete, { small: true }, (s) => {
                this.qrcodeHTML.innerHTML = s.split("\n").map(s => `<span>${s}</span>`).join("")
            })
            this.codeHTML.innerHTML = d.user_code.split("").map(s => `<span class="settings-modal-code-digit">${s}</span>`).join("")
            this.linkHTML.innerHTML = d.verification_uri
            let interval = d.interval
            this.spotifyConnecting = true
            const poll = async () => {
                if (!spotifyConnecting) {
                    return
                } else {
                    d = await checkAuthStatus(d.device_code)
                    if (d.access_token) {
                        console.log("✅ Authentification réussie !")
                        console.log("✅ Refresh token réussi !")
                        config['spotify-refresh-token'] = d.refresh_token;

                    } else {
                        console.log('Waiting for authorization...')
                        setTimeout(async () => {
                            await poll()
                        }, interval * 1000);
                    }
                }
            }
            poll()
        })
    }
}

module.exports = System