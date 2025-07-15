const Settings = require("./Settings");

class Camera {
    constructor(settings = new Settings()) {
        console.log("✅ SettingsApp-Camera class invoked");
        this.settings = settings

        let camerasSelect = document.getElementsByClassName("settings-cams-selector")
        let camerasPreview = document.getElementsByClassName("settings-cams-preview")
        this.controls = {
            "camerasSelecors": {
                "dashcam": camerasSelect[0],
                "front": camerasSelect[1],
                "back": camerasSelect[2],
            }
        }

        //Récupérer toutes les caméras du navigateur et les ajouter à la liste
        navigator.mediaDevices.enumerateDevices().then((devices) => {
            devices.forEach((device) => {
                if (device.kind === "videoinput") {
                    for (const deviceType in this.controls.camerasSelecors) {
                        let option = document.createElement("option");
                        option.value = device.deviceId;
                        option.innerHTML = device.label;
                        if (device.deviceId === mediaLoader.settings.data.camera.device[deviceType]) {
                            option.selected = true;
                        }
                        this.controls.camerasSelecors[deviceType].appendChild(option);
                    }
                }
            })
        })

        for (let i = 0; i < camerasSelect.length; i++) {
            const element = camerasSelect[i];
            element.addEventListener("change", () => {
                let camId = element.value;
                if (camId == "null") {
                    return camerasPreview[i].srcObject = null;
                }

                navigator.mediaDevices.getUserMedia({
                    video: {
                        deviceId: { exact: camId }
                    }
                }).then((stream) => {
                    let video = camerasPreview[i];
                    video.srcObject = stream;
                    video.play();
                }).catch((err) => {
                    console.error(err);
                })
            })
        }
    }
}

module.exports = Camera