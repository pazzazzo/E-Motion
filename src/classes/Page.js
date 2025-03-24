let active = ["add", "active", "remove"]
let hidden = ["remove", "hidden", "add"]

class View {
    #actual = "main"
    #pages_command = {"main": active, "rear-cam": active, "data-graph": active, "search": active, "youtube": active, "music": active}
    constructor() {
    }
    get actual() {
        return this.#actual
    }
    change(page) {
        if (!this.#pages_command[page]) {
            return console.log("null");
        }
        document.getElementById(this.#actual + "-view").classList[this.#pages_command[this.#actual][2]](this.#pages_command[this.#actual][1])
        document.getElementById(page + "-view").classList[this.#pages_command[page][0]](this.#pages_command[page][1])
        this.#actual = page
    }
    show(page) {
        document.getElementById(page + "-view").classList[this.#pages_command[page][0]](this.#pages_command[page][1])
    }
    hide(page) {
        document.getElementById(page + "-view").classList[this.#pages_command[page][2]](this.#pages_command[page][1])
    }
}
class Page {
    #actual = "load"
    #pages_command = {"load": active, "main": hidden}
    constructor() {
        this.view = new View()
    }
    get actual() {
        return this.#actual
    }
    change(page) {
        document.getElementById(this.#actual + "-screen").classList[this.#pages_command[this.#actual][2]](this.#pages_command[this.#actual][1])
        document.getElementById(page + "-screen").classList[this.#pages_command[page][0]](this.#pages_command[page][1])
        this.#actual = page
    }
}

module.exports = Page