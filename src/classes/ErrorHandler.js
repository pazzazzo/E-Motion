class ErrorHandler {
    constructor() {
        console.log("✅ ErrorHandler class invoked");
        window.onerror = (...e) => {
            const errorScreen = document.getElementById("error-screen")
            let msg = `<div class="error-popup"><div class="error-title">${e[0]}</div><div class="error-file">${e[1]}:${e[2]}:${e[3]}</div><div class="error-details">${e[4].stack.replace(new RegExp(__dirname + "/", "g"), "")}</div></div>`
            errorScreen.innerHTML += msg
            errorScreen.classList.add("active")
            if (mediaLoader && mediaLoader.playSound) {
                mediaLoader.playSound("error")
            }
        }
    }
}

module.exports = ErrorHandler