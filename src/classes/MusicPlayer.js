const MediaLoader = require("./MediaLoader");

class MusicPlayer {
    constructor(mediaLoader = new MediaLoader()) {
        console.log("✅ MusicPlayer class invoked");
        this.mediaLoader = mediaLoader;
        this.HTML = {
            main: document.getElementById("main-music"),
            minimize: document.getElementById("main-music-minimize"),
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
        this.currentPlayer = null
        this.interval;
        this.minimized = false
        this.HTML.minimize.addEventListener("click", () => {
            this.minimized = true
            this.HTML.main.classList.add("minimized")
            if (this.currentPlayer != "spotify") {
                this.HTML.main.style.background = "#0400ff url(./media/images/bluetooth-icon.png) center center/contain no-repeat local"
            } else {
                this.HTML.main.style.background = "rgb(59 177 22) url(./media/images/spotify-icon.png) center center/contain no-repeat local"
            }
        })
        this.HTML.main.addEventListener("click", (e) => {
            if (e.target != this.HTML.main) {
                return
            }
            if (this.minimized) {
                this.minimized = false
                this.HTML.main.classList.remove("minimized")
                let percentage = 0
                if (this.duration) {
                    percentage = Math.floor((this.current / this.duration) * 10000) / 100
                }
                this.HTML.main.style.background = `linear-gradient(90deg, #494c5b ${percentage - 1}%, #191a1e ${percentage}%)`
            }
        })
        this.HTML.previous.addEventListener("click", () => {
            if (this.mediaLoader.spotify.connected && this.mediaLoader.spotify.synced) {
                if (this.current > 3000) {
                    this.mediaLoader.spotify.seek(0)
                } else {
                    this.mediaLoader.spotify.previous()
                }
            } else {
                this.mediaLoader.bluetooth.musicPrevious()
            }
        })
        this.HTML.play.addEventListener("click", () => {
            if (this.mediaLoader.spotify.connected && this.mediaLoader.spotify.synced) {
                if (this.paused) {
                    this.mediaLoader.spotify.play()
                    this.HTML.play.children[0].innerHTML = "pause"
                } else {
                    this.mediaLoader.spotify.pause()

        this.HTML.play.children[0].innerHTML = "play_arrow"
                }
            } else {
                if (this.paused) {
                    this.mediaLoader.bluetooth.musicPlay()
                } else {
                    this.mediaLoader.bluetooth.musicPause()
                }
            }
        })
        this.HTML.next.addEventListener("click", () => {
            if (this.mediaLoader.spotify.connected && this.mediaLoader.spotify.synced) {
                this.mediaLoader.spotify.next()
            } else {
                this.mediaLoader.bluetooth.musicNext()
            }
        })

        mediaLoader.spotify.on("player.state", (state) => {
            if (state) {
                this.currentPlayer = "spotify"
                this.update(state)
            }
        })
        mediaLoader.bluetooth.on("bluetooth.track", (track) => {
            this.currentPlayer = "bluetooth"
            this.updateTrackInfo(track)
            this.updateTrackPosition(undefined, track.duration, undefined)
        })
        mediaLoader.bluetooth.on("bluetooth.position", (position) => {
            this.currentPlayer = "bluetooth"
            this.updateTrackPosition(position)
        })
        mediaLoader.bluetooth.on("bluetooth.cover", (cover) => {
            this.currentPlayer = "bluetooth"
            this.updateTrackImage(cover)
        })
        mediaLoader.bluetooth.on("bluetooth.status", (status) => {
            this.currentPlayer = "bluetooth"
            this.updateTrackPosition(undefined, undefined, status == "playing" ? false : true)
        })
    }
    updateTrackPosition(current, duration, paused) {
        this.current = current != undefined ? current : this.current
        this.duration = duration != undefined ? duration : this.duration
        this.paused = paused != undefined ? paused : this.paused
        let percentage = Math.floor((this.current / this.duration) * 10000) / 100
        if (!this.minimized) {
            this.HTML.main.style.background = `linear-gradient(90deg, #494c5b ${percentage - 1}%, #191a1e ${percentage}%)`
        }
        if (this.paused && this.interval) {
            clearInterval(this.interval)
            this.interval = undefined
        } else if (!this.paused) {
            if (this.interval) {
                clearInterval(this.interval)
            }
            this.interval = setInterval(() => {
                this.current += 1000
                let percentage = Math.floor((this.current / this.duration) * 10000) / 100
                if (!this.minimized) {
                    this.HTML.main.style.background = `linear-gradient(90deg, #494c5b ${percentage - 1}%, #191a1e ${percentage}%)`
                }
            }, 1000);
        }
        this.HTML.play.children[0].innerHTML = this.paused ? "play_arrow" : "pause"
    }
    updateTrackImage(image) {
        this.HTML.img.src = image || "./media/images/music-placeholder.png"
    }
    updateTrackInfo(track) {
        this.HTML.title.innerText = track.name
        this.HTML.artist.innerText = track.artist
    }
    update(track) {
        this.updateTrackInfo(track)
        this.updateTrackPosition(track.current, track.duration, track.paused)
        track.image && this.updateTrackImage(track.image)
    }
}

module.exports = MusicPlayer