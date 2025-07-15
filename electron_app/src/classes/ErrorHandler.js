class ErrorHandler {
    constructor() {
        console.log("✅ ErrorHandler class invoked");
        this.errorScreen = document.getElementById("error-screen")
        window.onerror = (...e) => {
            let msg = `<div class="error-popup"><div class="error-title">${e[0]}</div><div class="error-file">${e[1]}:${e[2]}:${e[3]} (on ${mediaLoader?.status || "unknown"} phase)</div><div class="error-details">${e[4].stack.replace(new RegExp(__dirname + "/", "g"), "")}</div></div>`
            this.errorScreen.innerHTML += msg
            this.errorScreen.classList.add("active")
            if (mediaLoader && mediaLoader.playSound) {
                mediaLoader.playSound("error")
            }
        }
        this.errorScreen.addEventListener("click", () => {
            this.errorScreen.classList.remove("active")
        })
    }
}

module.exports = ErrorHandler