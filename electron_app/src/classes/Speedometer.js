class Speedometer {
    constructor(config = {}) {
        console.log("✅ Speedometer class invoked");
        this.maxSpeed = config.maxSpeed || 40
    }
    init() {
        console.log("✅ Spotify class init");
        this.textElement = document.getElementById("speedometer-text-value")
        for (let i = 0; i <= this.maxSpeed*4; i++) {
            setTimeout(() => {
                this.setSpeed(i/4)
                if (i === this.maxSpeed*4) {
                    for (let j = this.maxSpeed*4; j >= 0; j--) {
                        setTimeout(() => {
                            this.setSpeed(j/4)
                        }, (this.maxSpeed*4 - j) * 3);
                    }
                }
            }, i * 3);
        }
        // this.setSpeed(this.maxSpeed)
        return this
    }
    setSpeed(speed) {
        document.documentElement.style.setProperty("--speed", `${speed / this.maxSpeed * 84}%`)
        this.textElement.innerText = speed.toFixed(1)
    }
}

module.exports = Speedometer