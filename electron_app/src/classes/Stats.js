const { ipcRenderer } = require("electron");
const EventEmitter = require('events');
const fs = require("fs");

function pad(n) {
    return String(n).padStart(2, '0');
}

function formatDate(date, opts = { withYear: true }) {
    const M = pad(date.getMonth() + 1);
    const D = pad(date.getDate());
    return opts.withYear ? `${M}/${D}/${date.getFullYear()}` : `${D}/${M}`;
}

class DataGraph {
    constructor() {
        console.log("✅ DataGraph class invoked");
        let raw;
        try {
            raw = fs.readFileSync(mediaLoader.datagraphPath, 'utf8');
            this.fileContent = JSON.parse(raw);
        } catch (err) {
            console.error('Read/parsing datagraph error: ', err);
            this.fileContent = {};
        }
    }

    get(key) {
        return this.fileContent[key];
    }
}

class Data extends EventEmitter {
    constructor() {
        console.log("✅ Data class invoked");
        super();
        this.data = {};
    }
}

class DataFile extends Data {
    constructor(key, datagraph) {
        console.log("✅ DataFile class invoked");
        super();
        this.key = key;
        this.data = datagraph.get(key) || {};
    }

    getDatasetByDate(date = new Date()) {
        const key = formatDate(date, { withYear: true });
        const value = this.data[key];
        return [formatDate(date, { withYear: false }), value || 0]
    }

    getDatasetsByDateRange(start = new Date(), end = new Date()) {
        const labels = [], values = [];
        let cur = new Date(start), fin = new Date(end);

        if (cur > fin) [cur, fin] = [fin, cur];

        while (cur <= fin) {
            const item = this.getDatasetByDate(cur);
            labels.push(item[0]);
            values.push(item[1]);
            cur.setDate(cur.getDate() + 1);
        }
        return [labels, values];
    }

    getDatasetsByDatesNumber(start = new Date(), n = 1) {
        let end = new Date(start)
        end.setDate(end.getDate() + n)
        return this.getDatasetsByDateRange(start, end)
    }
}

class Stats extends EventEmitter {
    constructor() {
        console.log("✅ Stats class invoked");
        super();
        this.datagraph = new DataGraph();
        this.dataUse = new DataFile("data_use", this.datagraph)
        ipcRenderer.on("proxy.update", (event, opt) => {
            let id = formatDate(new Date(), {withYear: true})
            this.dataUse.data[id] = opt.total
            // console.log(opt.stats);
            // {
            //     "api.mapbox.com": {
            //         "sent": 152782,
            //         "received": 20208184
            //     },
            //     "maps.googleapis.com": {
            //         "sent": 49329,
            //         "received": 67563
            //     },
            //     "events.mapbox.com": {
            //         "sent": 269672,
            //         "received": 126297
            //     },
            //     "apresolve.spotify.com": {
            //         "sent": 28262,
            //         "received": 39027
            //     },
            //     "web-sdk-assets.spotifycdn.com": {
            //         "sent": 93732,
            //         "received": 50655791
            //     },
            //     "api.spotify.com": {
            //         "sent": 80589,
            //         "received": 32287
            //     },
            //     "www.waze.com": {
            //         "sent": 36396,
            //         "received": 622378
            //     },
            //     "gew1-dealer.spotify.com": {
            //         "sent": 291782,
            //         "received": 250490
            //     },
            //     "cpapi.spotify.com": {
            //         "sent": 200987,
            //         "received": 91856
            //     },
            //     "fonts.googleapis.com": {
            //         "sent": 2536,
            //         "received": 7607
            //     },
            //     "seektables.scdn.co": {
            //         "sent": 6239,
            //         "received": 9623
            //     },
            //     "audio-ak.spotifycdn.com": {
            //         "sent": 39812,
            //         "received": 11464624
            //     },
            //     "i.scdn.co": {
            //         "sent": 7674,
            //         "received": 307680
            //     },
            //     "sdk.scdn.co": {
            //         "sent": 12193,
            //         "received": 9653
            //     },
            //     "is1-ssl.mzstatic.com": {
            //         "sent": 15369,
            //         "received": 4904968
            //     },
            //     "itunes.apple.com": {
            //         "sent": 75986,
            //         "received": 1382267
            //     }
            // }


            this.dataUse.emit("update", id, formatDate(new Date(), {withYear: false}), opt.total)
        })
    }
}

module.exports = Stats;
