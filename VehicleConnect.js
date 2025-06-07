const { app, BrowserWindow, ipcMain } = require('electron')
const can = require('socketcan');
const { exec } = require('child_process');

class VehicleConnect {
    constructor(config = { mainWindow: new BrowserWindow() }) {
        this.mainWindow = config.mainWindow
        this.genericPIDs = [
            { pid: "00", description: "PIDs supportés 01-20" },
            { pid: "01", description: "Statut du moniteur depuis l'effacement des DTC" },
            { pid: "02", description: "Données du gel (freeze frame) DTC" },
            { pid: "03", description: "Statut du système de carburant" },
            { pid: "04", description: "Charge moteur calculée" },
            { pid: "05", description: "Température du liquide de refroidissement" },
            { pid: "06", description: "Court terme - Ajustement du mélange (bank 1)" },
            { pid: "07", description: "Long terme - Ajustement du mélange (bank 1)" },
            { pid: "08", description: "Court terme - Ajustement du mélange (bank 2)" },
            { pid: "09", description: "Long terme - Ajustement du mélange (bank 2)" },
            { pid: "0A", description: "Pression du carburant" },
            { pid: "0B", description: "Pression absolue du collecteur d'admission" },
            { pid: "0C", description: "Régime moteur (RPM)" },
            { pid: "0D", description: "Vitesse du véhicule" },
            { pid: "0E", description: "Avance à l'allumage" },
            { pid: "0F", description: "Température de l'air d'admission" },
            { pid: "10", description: "Débit massique d'air (MAF)" },
            { pid: "11", description: "Position de la pédale d'accélérateur" },
            { pid: "12", description: "Statut de l'air secondaire commandé" },
            { pid: "13", description: "Nombre de capteurs d'oxygène" },
            { pid: "14", description: "Capteur O2 (banc 1, capteur 1) - tension" },
            { pid: "15", description: "Capteur O2 (banc 1, capteur 2) - tension" },
        ];

        this.listCanInterfaces((err, interfaces) => {
            if (err) {
                console.error("Erreur lors de la récupération des interfaces CAN.");
                return;
            }
            if (interfaces.length) {
                const currentInterface = interfaces[0]
                console.log(`Can interfaces: ${interfaces.join(", ")}`);
                
                this.channel = can.createRawChannel(currentInterface, true);
                this.channel.addListener("onMessage", (msg) => {
                    if (msg.data && msg.data.length > 1 && msg.data[0] >= 0x40) {
                        const pidByte = msg.data[1];
                        const pidHex = pidByte.toString(16).toUpperCase().padStart(2, '0');

                        const pidInfo = this.genericPIDs.find(item => item.pid === pidHex);
                        if (pidInfo) {
                            console.log(`Message CAN reçu - PID 0x${pidHex} (${pidInfo.description}) :`, msg);
                        }
                    } else {
                    }
                });

                // Démarrer le canal
                this.channel.start();

                console.log("En écoute sur l'interface CAN 'vcan0' pour les PID génériques OBD-II...");
            } else {
                console.log("Aucune interface trouvée");
            }
        });
    }
    speedChange(speed) {
        this.mainWindow.webContents.send("data.speed", speed)
    }
    tempChange(temp) {
        this.mainWindow.webContents.send("data.temp", temp)
    }
    batteryChange(percent) {
        this.mainWindow.webContents.send("data.battery", percent)
    }
    positonChange(long, lat) {
        this.mainWindow.webContents.send("data.position", long, lat)
    }
    headindChange(bearing) {
        this.mainWindow.webContents.send("data.heading", bearing)
    }
    controlClick(name, pressed) {
        this.mainWindow.webContents.send(`control.${name}`, pressed)
    }
    getVIN() {
        return "ZFF*abcdef*000000"
    }
    checkVIN() {
        return true
    }

    /**
    * Liste les interfaces réseaux de type CAN virtuel (vcan) disponibles sur le système.
    *
    * Exécute la commande `ip -o link show type vcan` pour récupérer les noms
    * d'interfaces, puis renvoie le résultat via le callback.
    *
    * @param {function(Error|null, string[])} callback - 
    *   Fonction de rappel appelée à la fin de l'exécution.
    *   - En cas d'erreur d'exécution de la commande, reçoit l'objet Error en premier argument et `null` en second.
    *   - En cas de succès, reçoit `null` en premier argument et un tableau de chaînes (noms d'interfaces) en second.
    */
    listCanInterfaces(callback) {
        // Exécute la commande qui liste les interfaces de type CAN
        exec('ip -o link show type vcan', (error, stdout, stderr) => {
            if (error) {
                console.error(`Erreur lors de l'exécution de la commande: ${error.message}`);
                callback(error, null);
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
            }
            const interfaces = stdout.match(/(?<=\d: )\w+/g) || []

            callback(null, interfaces);
        });
    }
}

module.exports = VehicleConnect