const EventEmitter = require('events');
const express = require('express');
const PORT = process.env.PORT || 3000;
const os = require('os');

function getServerIPs() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                addresses.push({ interface: name, address: iface.address });
            }
        }
    }
    return addresses;
}

class LocationServer extends EventEmitter {
    constructor() {
        super()
        this.app = express();
        this.app.get("/log", (req, res) => {
            // Récupération des paramètres de requête
            const { lat, lon, s, time, dir } = req.query;

            // Validation sommaire
            if (!lat || !lon || !s || !time || !dir) {
                return res.status(400).json({ error: 'Paramètres manquants. Attendu: lat, lon, s, time.' });
            }

            // Conversion éventuelle des types
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lon);
            const direction = parseFloat(dir);
            const speed = parseFloat(s);
            const timestamp = new Date(time);

            // Vérifier les conversions
            if (isNaN(latitude) || isNaN(longitude) || isNaN(direction) || isNaN(speed) || isNaN(timestamp.getTime())) {
                return res.status(400).json({ error: 'Paramètres invalides.' });
            }

            // Traitement des données reçues (exemple: affichage dans la console)
            console.log(`Reçu \n\tPosition: (${latitude}, ${longitude})\n\tDirection: ${direction}\n\tVitesse: ${speed}\n\tTime: ${timestamp.toISOString()}`);
            this.emit("update", {
                latitude, longitude, direction, speed, time: timestamp.toISOString()
            })
            // Réponse au client
            return res.json({ lat: latitude, lon: longitude, dir: direction, s: speed, time: timestamp.toISOString() });
        })
        this.app.listen(PORT, () => {
            console.log(`Serveur HTTP démarré sur http://localhost:${PORT}`);
            // Affiche les adresses IP du serveur
            const serverIPs = getServerIPs();
            if (serverIPs.length > 0) {
                console.log('Adresses IP du serveur :');
                serverIPs.forEach(ipInfo => {
                    console.log(` - Interface ${ipInfo.interface}: ${ipInfo.address}`);
                });
            } else {
                console.log("Aucune adresse IPv4 externe détectée.");
            }
        });
    }
}

module.exports = LocationServer