const EventEmitter = require('events');
const { SimpleKeyboard } = require("simple-keyboard")


class Keyboard extends EventEmitter {
    constructor() {
        super()
        this.keyboard = new SimpleKeyboard({
            onChange: e => this.emit("change", e),
            onKeyPress: e => this.emit("press", e),
            theme: "hg-theme-default blackTheme",
            layout: {
                default: [
                    "` 1 2 3 4 5 6 7 8 9 0 \u00B0 + {bksp}",
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
    }
    show() {
        document.getElementsByClassName("simple-keyboard")[0].classList.add("active")
    }
    hide() {
        document.getElementsByClassName("simple-keyboard")[0].classList.remove("active")
    }
    stop() {
        this.keyboard.destroy()
        this.removeAllListeners("change")
        this.removeAllListeners("press")
    }
}

module.exports = Keyboard