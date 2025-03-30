let active = ["add", "active", "remove"]
let hidden = ["remove", "hidden", "add"]

class Apps {
    #actual = null;
    constructor(view = new View()) {
        console.log("✅ Apps class invoked");
        this.view = view
    }
    show(app) {
        this.closeApp()
        document.getElementById(`${app}-app`).classList.add("active")
        this.view.change("apps")
        this.#actual = app
    }
    close() {
        this.closeApp()
        this.view.change("main")
    }
    closeApp() {
        if (this.#actual) {
            document.getElementById(`${this.#actual}-app`).classList.remove("active")
        }
        this.#actual = null
    }
}
class View {
    #actual = "main"
    #pages_command = { "main": active, "rear-cam": active, "data-graph": active, "search": active, "youtube": active, "music": active, "wifi": active, "apps": active }
    constructor() {
        console.log("✅ View class invoked");
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
    #pages_command = { "load": active, "main": hidden }
    constructor() {
        console.log("✅ Page class invoked");
        this.view = new View()
        this.apps = new Apps(this.view)
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