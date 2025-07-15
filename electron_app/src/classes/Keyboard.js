const EventEmitter = require('events');
const { SimpleKeyboard } = require("simple-keyboard")


class Keyboard extends EventEmitter {
    constructor(config = {}) {
        super()
        console.log("✅ Keyboard class invoked");
        this.config = config
        this.keyboard = new SimpleKeyboard({
            onChange: e => this.emit("change", e),
            onKeyPress: e => this.emit("press", e),
            theme: "hg-theme-default blackTheme",
            layout: {
                default: [
                    "é 1 2 3 4 5 6 7 8 9 0 \u00B0 + {bksp}",
                    "{tab} a z e r t y u i o p ^ $",
                    "{lock} q s d f g h j k l m \u00F9 * {enter}",
                    "{shift} < w x c v b n , ; : ! {shift}",
                    "{space}",
                ],
                shift: [
                    "\u00B2 & \u00E9 \" ' ( - \u00E8 _ \u00E7 \u00E0 ) = {bksp}",
                    "{tab} A Z E R T Y U I O P \u00A8 \u00A3",
                    "{lock} Q S D F G H J K L M % \u00B5 {enter}",
                    "{shift} > W X C V B N ? . / \u00A7 {shift}",
                    "{space}",
                ],
            },
        });

        // this.shortcut = document.createElement("div")
        // this.shortcut.classList.add("simple-keyboard-shortcuts")
        // this.keyboard.keyboardDOM.firstChild.appendChild(this.shortcut)
        // this.addShortcut("test A")
        // this.addShortcut("test B")
        // this.addShortcut("test C")
        
    }
    addShortcut(text) {
        let btn = document.createElement("div")
        btn.classList.add("simple-keyboard-shortcut")
        btn.innerHTML = `<img src="./media/images/star.png" class="simple-keyboard-shortcut-icon"><span>${text}</span>`
        this.shortcut.appendChild(btn)
        
    }
    show() {
        document.getElementsByClassName("simple-keyboard")[0].classList.add("active")
        return this
    }
    hide() {
        document.getElementsByClassName("simple-keyboard")[0].classList.remove("active")
        return this
    }
    stop() {
        this.keyboard.clearInput()
        this.keyboard.destroy()
        this.removeAllListeners("change")
        this.removeAllListeners("press")
    }
}

module.exports = Keyboard