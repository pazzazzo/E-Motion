class Speedometer {
    constructor(config = {}) {
        this.maxSpeed = config.maxSpeed || 40
    }
    init() {
        this.textElement = document.getElementById("speedometer-text-value")
        for (let i = 0; i <= this.maxSpeed*2; i++) {
            setTimeout(() => {
                this.setSpeed(i/2)
                if (i === this.maxSpeed*2) {
                    for (let j = this.maxSpeed*2; j >= 0; j--) {
                        setTimeout(() => {
                            this.setSpeed(j/2)
                        }, (this.maxSpeed*2 - j) * 12);
                    }
                }
            }, i * 12);
        }
        return this
    }
    setSpeed(speed) {
        document.documentElement.style.setProperty("--speed", `${speed / this.maxSpeed * 90}%`)
        this.textElement.innerText = speed.toFixed(1)
    }
}

module.exports = Speedometer