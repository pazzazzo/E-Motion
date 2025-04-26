const { Chart: Def } = require("chart.js/auto")

class Chart {
    constructor(ctx, options = {}) {
        console.log("✅ Chart class invoked");
        this.data = {}
        if (options.x) {
            this.data = {
                labels: options.x,
                datasets: []
            }
        }
        if (options.y) {
            options.y.forEach(y => {
                this.data.datasets.push({
                    label: y.label,
                    data: y.data,
                    borderWidth: 1,
                    cubicInterpolationMode: y.rounded ? 'monotone' : "default",
                    tension: y.rounded ? 0.4 : 0,
                    pointBackgroundColor: "#00000000",
                    pointBorderColor: "#00000000",
                    fill: y.fill,
                    pointHoverBackgroundColor: "#ffffff",
                    pointRadius: 9
    
                })
            })
        }
        this.chart = new Def(ctx, {
            type: options.type || "line",
            data: this.data || {},
            options: {
                indexAxis: options.horizontal ? "y" : "x",
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: "index",
                    axis: options.horizontal ? "y" : "x",
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            display: true,
                            color: "#87878d",
                            lineWidth: 2,
                            offset: false,
                        },
                        border: {
                            dash: [2, 4],
                        },
                        ticks: {
                            // callback: (v, i) => `${v}${options.unit || ""}`
                        },
                    },
                    x: {
                        grid: {
                            display: true,
                            color: "#87878d",
                            lineWidth: 2,
                        },
                        border: {
                            dash: [2, 4],
                        }
                    },
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false,
                        callbacks: {
                            label: (data) => data.formattedValue + (options.unit || ""),
                        },
                        position: "nearest",
                        external: externalTooltipHandler
                    }
                },

            },
            plugins: [
                {
                    id: 'verticalHoverLine',
                    beforeDatasetsDraw(chart) {
                        const {
                            ctx,
                            chartArea: { top, bottom }
                        } = chart;

                        // Paramètres modifiables
                        const color = 'gray';
                        const lineWidth = 1;

                        ctx.save();
                        ctx.strokeStyle = color;
                        ctx.lineWidth = lineWidth;

                        // Pour chaque dataset (index 0 seulement si tu préfères)
                        chart.data.datasets.forEach((_, datasetIndex) => {
                            const meta = chart.getDatasetMeta(datasetIndex);
                            meta.data.forEach((point) => {
                                if (point.active) {
                                    const x = point.x;
                                    ctx.beginPath();
                                    ctx.moveTo(x, top);
                                    ctx.lineTo(x, bottom);
                                    ctx.stroke();
                                }
                            });
                        });

                        ctx.restore();
                    }
                }
            ]
        })
        if (options.height) {
            this.chart.canvas.parentElement.style.height = options.height
        }
    }
    updateValue(datasetId, valueIndex, data) {
        this.chart.data.datasets[datasetId].data[valueIndex] = data
        this.chart.update()
    }
    updateLast(id, data) {
        this.updateValue(id, this.chart.data.datasets[id].data.length - 1, data)
    }
    addStat (data, options) {
        let dataset = data[options.type](...options.args)
        if (options.convertCallback) {
            dataset[1] = dataset[1].map(options.convertCallback)
        }
        this.chart.data.labels = dataset[0]
        let datasetid = this.chart.data.datasets.length
        this.chart.data.datasets.push({
            label: options.params.label,
            data: dataset[1],
            borderWidth: 1,
            cubicInterpolationMode: options.params.rounded ? 'monotone' : "default",
            tension: options.params.rounded ? 0.4 : 0,
            pointBackgroundColor: "#00000000",
            pointBorderColor: "#00000000",
            fill: options.params.fill,
            pointHoverBackgroundColor: "#ffffff",
            pointRadius: 9
        })
        data.on("update", (id, label, value) => {
            let index = this.chart.data.labels.indexOf(label)
            if (index > -1) {
                this.updateValue(datasetid, index, options.convertCallback ? options.convertCallback(value) : value)
            }
        })
    }
}

const getOrCreateTooltip = (chart) => {
    let tooltipEl = document.getElementById("chartjs-tooltip-" + chart.canvas.id)

    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.id = "chartjs-tooltip-" + chart.canvas.id
        tooltipEl.style.background = 'rgba(0, 0, 0, 0.7)';
        tooltipEl.style.borderRadius = '3px';
        tooltipEl.style.color = 'white';
        tooltipEl.style.opacity = 1;
        tooltipEl.style.pointerEvents = 'none';
        tooltipEl.style.position = 'absolute';
        tooltipEl.style.transform = 'translate(-50%, 0)';
        tooltipEl.style.transition = 'all .1s ease';

        const table = document.createElement('table');
        table.style.margin = '0px';

        tooltipEl.appendChild(table);
        chart.canvas.parentNode.appendChild(tooltipEl);
    }

    return tooltipEl;
};

const externalTooltipHandler = (context) => {
    // Tooltip Element
    const { chart, tooltip } = context;
    const tooltipEl = getOrCreateTooltip(chart);

    // Hide if no tooltip
    if (tooltip.opacity === 0) {
        tooltipEl.style.opacity = 0;
        return;
    }

    // Set Text
    if (tooltip.body) {
        const titleLines = tooltip.title || [];
        const bodyLines = tooltip.body.map(b => b.lines);

        const tableHead = document.createElement('thead');

        titleLines.forEach(title => {
            const tr = document.createElement('tr');
            tr.style.borderWidth = 0;

            const th = document.createElement('th');
            th.style.borderWidth = 0;
            const text = document.createTextNode(title);

            th.appendChild(text);
            tr.appendChild(th);
            tableHead.appendChild(tr);
        });

        const tableBody = document.createElement('tbody');
        bodyLines.forEach((body, i) => {
            const colors = tooltip.labelColors[i];

            const span = document.createElement('span');
            span.style.background = colors.backgroundColor;
            span.style.borderColor = colors.borderColor;
            span.style.borderWidth = '2px';
            span.style.marginRight = '10px';
            span.style.height = '10px';
            span.style.width = '10px';
            span.style.display = 'inline-block';

            const tr = document.createElement('tr');
            tr.style.backgroundColor = 'inherit';
            tr.style.borderWidth = 0;

            const td = document.createElement('td');
            td.style.borderWidth = 0;

            const text = document.createTextNode(body);

            td.appendChild(span);
            td.appendChild(text);
            tr.appendChild(td);
            tableBody.appendChild(tr);
        });

        const tableRoot = tooltipEl.querySelector('table');

        // Remove old children
        while (tableRoot.firstChild) {
            tableRoot.firstChild.remove();
        }

        // Add new children
        tableRoot.appendChild(tableHead);
        tableRoot.appendChild(tableBody);
    }

    const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;

    // Display, position, and set styles for font
    tooltipEl.style.opacity = 1;
    tooltipEl.style.left = positionX + tooltip.caretX + 'px';
    tooltipEl.style.top = positionY + tooltip.caretY + 16 + 'px';
    tooltipEl.style.font = tooltip.options.bodyFont.string;
    tooltipEl.style.padding = tooltip.options.padding + 'px ' + tooltip.options.padding + 'px';
};

module.exports = Chart