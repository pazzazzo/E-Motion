const { ipcRenderer } = require("electron");

const buttons = [
    "accelerator", "breaks"
]
const switchs = [
    
]
const cursors = [
    "battery", "temp"
]

buttons.forEach(btn => {
    const el = document.getElementById(btn)
    el.addEventListener("mousedown", () => {
        ipcRenderer.send(`dev.button`, { "name": btn, "pressed": true })
    })
    el.addEventListener("mouseup", () => {
        ipcRenderer.send(`dev.button`, { "name": btn, "pressed": false })
    })
})

switchs.forEach(sw => {
    const el = document.getElementById(sw)
    el.addEventListener("click", () => {
        el.classList.toggle("active")
        ipcRenderer.send(`dev.switch`, { "name": sw, "activate": el.classList.contains("active") })
    })
})

cursors.forEach(crs => {
    const card = document.getElementById(crs)
    const cursor = card.getElementsByTagName("input")[0]
    const valuetxt = card.getElementsByClassName("value")[0]
    console.log(cursor);
    cursor.addEventListener("input", () => {
        if (valuetxt) {
            valuetxt.innerHTML = cursor.value
        }
        ipcRenderer.send(`dev.cursor`, { "name": crs, "value": cursor.value })
    })
})