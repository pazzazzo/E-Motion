const Settings = require("./Settings");
const fs = require("fs")
const path = require("path")

class Navbar {
    constructor(settings = new Settings()) {
        console.log("✅ SettingsApp-Navbar class invoked");
        this.settings = settings
        this.navsContainer = document.getElementById("settings-navs")
        this.load()
    }
    load() {
        mediaLoader.settings.data["navbar"].forEach((navEl, i) => {
            let pth = mediaLoader.apps.get(navEl.id)
            let manifest = JSON.parse(fs.readFileSync(path.join(pth, "manifest.json")).toString())
            console.log(manifest, navEl);

            // Container principal
            const container = document.createElement('div');
            container.classList.add('settings-nav');

            // Bloc "upsidedown" avec les flèches
            const upsidedown = document.createElement('div');
            upsidedown.classList.add('settings-nav-upsidedown');

            const upside = document.createElement('div');
            upside.classList.add('settings-nav-upside');
            const spanUp = document.createElement('span');
            spanUp.classList.add('material-symbols-outlined');
            spanUp.textContent = 'arrow_upward';
            upside.appendChild(spanUp);
            upside.addEventListener("click", () => {
                if (i > 0) {
                    [mediaLoader.settings.data["navbar"][i], mediaLoader.settings.data["navbar"][i - 1]] = [mediaLoader.settings.data["navbar"][i - 1], mediaLoader.settings.data["navbar"][i]]
                    this.reset()
                    this.load()
                }
            })

            const down = document.createElement('div');
            down.classList.add('settings-nav-down');
            const spanDown = document.createElement('span');
            spanDown.classList.add('material-symbols-outlined');
            spanDown.textContent = 'arrow_downward';
            down.appendChild(spanDown);
            down.addEventListener("click", () => {
                if (i < mediaLoader.settings.data["navbar"].length - 1) {
                    [mediaLoader.settings.data["navbar"][i], mediaLoader.settings.data["navbar"][i + 1]] = [mediaLoader.settings.data["navbar"][i + 1], mediaLoader.settings.data["navbar"][i]]
                    this.reset()
                    this.load()
                }
            })

            upsidedown.append(upside, down);
            container.appendChild(upsidedown);

            // Bloc icône
            const iconContainer = document.createElement('div');
            iconContainer.classList.add('settings-nav-icon-container');
            const icon = document.createElement('div');
            icon.classList.add('settings-nav-icon');
            icon.style.boxShadow = `0px 0px 0px 2px ${navEl.color || manifest["default-color"]}`
            const img = document.createElement('img');
            img.src = './media/images/settings-icon.png';
            img.alt = '';
            icon.appendChild(img);
            iconContainer.appendChild(icon);
            container.appendChild(iconContainer);

            // Bloc principal (nom + couleur)
            const mainDiv = document.createElement('div');
            mainDiv.classList.add('settings-nav-main');
            const nameDiv = document.createElement('div');
            nameDiv.classList.add('settings-nav-name');
            nameDiv.textContent = manifest.name || "Application sans nom";
            const inputColor = document.createElement('input');
            inputColor.type = 'color';
            inputColor.classList.add('settings-nav-color');
            inputColor.value = `${navEl.color || manifest["default-color"]}`;
            inputColor.addEventListener("input", (e) => {
                mediaLoader.settings.data["navbar"][i].color = inputColor.value
                icon.style.boxShadow = `0px 0px 0px 2px ${inputColor.value}`
            })
            mainDiv.append(nameDiv, inputColor);
            container.appendChild(mainDiv);

            // Bouton supprimer
            const deleteDiv = document.createElement('div');
            deleteDiv.classList.add('settings-nav-delete');
            if ((navEl.removable === false || manifest.removable === false) && mediaLoader.settings.data["navbar"].filter(item => item.id === navEl.id).length === 1) {
                deleteDiv.classList.add('disabled');
            } else {
                deleteDiv.addEventListener("click", () => {
                    mediaLoader.settings.data["navbar"].splice(i, 1)
                    this.reset()
                    this.load()
                })
            }
            const spanDel = document.createElement('span');
            spanDel.classList.add('material-symbols-outlined');
            spanDel.textContent = 'delete';
            deleteDiv.appendChild(spanDel);
            container.appendChild(deleteDiv);

            this.navsContainer.appendChild(container)
        });
    }
    reset() {
        // for (let i = 0; i < this.navsContainer.children.length; i++) {
        //     this.navsContainer.children[0].remove()
        // }
        this.navsContainer.innerHTML = ""
    }
}

module.exports = Navbar