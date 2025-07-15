class Powermeter {
    constructor(config = {}) {
        console.log("✅ Powermeter class invoked");
        this.maxPowerOut= config.maxPowerOut || 1000
        this.maxPowerIn= config.maxPowerOut || 200
    }
    init() {
        console.log("✅ Powermeter class init");
        this.textElement = document.getElementById("powermeter-text-value")
        for (let i = 0; i <= this.maxPowerOut*4; i++) {
            setTimeout(() => {
                this.setPower(i/4)
                if (i === this.maxPowerOut*4) {
                    for (let j = this.maxPowerOut*4; j >= 0; j--) {
                        setTimeout(() => {
                            this.setPower(j/4)
                        }, (this.maxPowerOut*4 - j)/10);
                    }
                }
            }, i/10);
        }
        // this.setPower(this.maxSpeed)
        return this
    }
    setPower(power) {
        if (power > 0) {
            document.documentElement.style.setProperty("--power-out", `${power / this.maxPowerOut * 75}%`)
            document.documentElement.style.setProperty("--power-in", `0%`)
            this.textElement.innerText = power.toFixed(0)
        } else {
            document.documentElement.style.setProperty("--power-out", `0%`)
            document.documentElement.style.setProperty("--power-in", `${-power / this.maxPowerOut * 25}%`)
            this.textElement.innerText = power.toFixed(0)
        }
    }
}

module.exports = Powermeter