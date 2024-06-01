const { Chart } = require("chart.js")
const fs = require("fs");
const path = require("path");

let datagraph = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "datagraph.json").toString()))
function save() {
    fs.writeFileSync(path.join(__dirname, "..", "datagraph.json"), JSON.stringify(datagraph))
}

class DataGraph {
    constructor() {
    }
    init(cb) {
        console.log(Date.now());
        this.speedGraph = new Graph({type: "speed", index: 0, ctx: document.getElementById("data-graph-speed"), name: "Vitesse (km/h)"})
        this.powerGraph = new Graph({type: "power", index: 0, ctx: document.getElementById("data-graph-power"), name: "Puissance (W)"})
        this.tempGraph = new Graph({type: "temp", index: 0, ctx: document.getElementById("data-graph-temp"), name: "Température (°C)"})
        this.batteryGraph = new Graph({type: "battery", index: 0, ctx: document.getElementById("data-graph-battery"), name: "Batterie (%)"})

        cb()
    }
}

class Graph {
    constructor(config = {}) {
        this.type = config.type
        this.index = config.index
        this.id = config.id
        this.ctx = config.ctx
        this.name = config.name

        if (this.id) {
            datagraph[this.type].forEach((dataset, i) => {
                if (dataset.id === this.id) {
                    this.index = i
                }
            });    
        } else {
            this.id = datagraph[this.type][this.index].id
        }
        
        let labels = []
        for (let i = 0; i < datagraph[this.type][this.index].data.length; i++) {
            labels.push(`${("0" + new Date(this.id + i*60000).getHours()).slice(-2)}:${("0" + new Date(this.id + i*60000).getMinutes()).slice(-2)}`)
        }

        this.chart = new Chart(this.ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: this.name,
                    data: datagraph[this.type][this.index].data,
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                color: "white",
            },

        });
    }
}

module.exports = DataGraph