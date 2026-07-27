'use strict';
let $plugins = {
    prop: {
        months: ['1월',
            '2월',
            '3월',
            '4월',
            '5월',
            '6월',
            '7월'
        ],
        emptyToggle: false
    },
    hook: {
        pageLoad() {
            $this.method.playAreaBorder();
            $this.method.renderEmptyState();
            $this.method.playQuadrants();
        }
    },
    event: {
        btnToggleEmpty_click() {
            $this.prop.emptyToggle = !$this.prop.emptyToggle;
            $this.method.renderEmptyState();
        }
    },
    method: {
        randomData(count, min, max) {
            return Array.from({
                length: count
            }, () => Math.round(min + Math.random() * (max - min)));
        },
        playAreaBorder() {
            const months = $this.prop.months;
            syn.uicontrols.$chartjs.setConfig('chtAreaBorder', {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [{
                        label: '매출',
                        data: $this.method.randomData(months.length, 20, 90),
                        backgroundColor: 'rgb(54, 162, 235)'
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Chart Area Border'
                        },
                        legend: {
                            display: false
                        },
                        chartAreaBorder: {
                            color: 'rgb(75, 85, 99)',
                            width: 2
                        }
                    }
                },
                plugins: [{
                    id: 'chartAreaBorder',
                    beforeDraw(chart, args, pluginOptions) {
                        const ctx = chart.ctx;
                        const area = chart.chartArea;
                        ctx.save();
                        ctx.strokeStyle = pluginOptions.color || '#333';
                        ctx.lineWidth = pluginOptions.width || 1;
                        ctx.strokeRect(area.left, area.top, area.right - area.left, area.bottom - area.top);
                        ctx.restore();
                    }
                }]
            });
        },
        renderEmptyState() {
            const hasData = $this.prop.emptyToggle === false;
            const data = hasData ? [12,
                19,
                8,
                22
            ] : [0,
                0,
                0,
                0
            ];
            syn.uicontrols.$chartjs.setConfig('chtEmptyState', {
                type: 'doughnut',
                data: {
                    labels: ['빨강',
                        '파랑',
                        '초록',
                        '노랑'
                    ],
                    datasets: [{
                        data,
                        backgroundColor: ['rgb(255, 99, 132)',
                            'rgb(54, 162, 235)',
                            'rgb(75, 192, 192)',
                            'rgb(255, 205, 86)'
                        ]
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Doughnut Empty State'
                        }
                    }
                },
                plugins: [{
                    id: 'doughnutEmptyState',
                    afterDraw(chart) {
                        const values = chart.data.datasets[0].data;
                        const isEmpty = values.length === 0 || values.every((value) => !value);
                        if (!isEmpty) {
                            return;
                        }
                        const ctx = chart.ctx;
                        const meta = chart.getDatasetMeta(0);
                        const element = meta.data[0];
                        if (!element) {
                            return;
                        }
                        const props = element.getProps(['x',
                            'y',
                            'innerRadius',
                            'outerRadius',
                            'startAngle',
                            'endAngle'
                        ], true);
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(props.x, props.y, (props.innerRadius + props.outerRadius) / 2, props.startAngle, props.endAngle);
                        ctx.lineWidth = props.outerRadius - props.innerRadius;
                        ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
                        ctx.stroke();
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.font = '13px sans-serif';
                        ctx.fillStyle = '#94a3b8';
                        ctx.fillText('데이터 없음', props.x, props.y);
                        ctx.restore();
                    }
                }]
            });
        },
        playQuadrants() {
            const points = Array.from({
                length: 30
            }, () => ({
                x: Math.round(-50 + Math.random() * 100),
                y: Math.round(-50 + Math.random() * 100)
            }));
            syn.uicontrols.$chartjs.setConfig('chtQuadrants', {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: '측정값',
                        data: points,
                        backgroundColor: 'rgb(55, 65, 81)'
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Quadrants'
                        },
                        legend: {
                            display: false
                        },
                        quadrants: {
                            colors: {
                                topLeft: 'rgba(255, 99, 132, 0.12)',
                                topRight: 'rgba(75, 192, 192, 0.12)',
                                bottomLeft: 'rgba(255, 205, 86, 0.12)',
                                bottomRight: 'rgba(54, 162, 235, 0.12)'
                            }
                        }
                    },
                    scales: {
                        x: {
                            min: -50,
                            max: 50
                        },
                        y: {
                            min: -50,
                            max: 50
                        }
                    }
                },
                plugins: [{
                    id: 'quadrants',
                    beforeDraw(chart, args, pluginOptions) {
                        const ctx = chart.ctx;
                        const area = chart.chartArea;
                        const xScale = chart.scales.x;
                        const yScale = chart.scales.y;
                        const zeroX = xScale.getPixelForValue(0);
                        const zeroY = yScale.getPixelForValue(0);
                        const colors = pluginOptions.colors;
                        ctx.save();
                        ctx.fillStyle = colors.topLeft;
                        ctx.fillRect(area.left, area.top, zeroX - area.left, zeroY - area.top);
                        ctx.fillStyle = colors.topRight;
                        ctx.fillRect(zeroX, area.top, area.right - zeroX, zeroY - area.top);
                        ctx.fillStyle = colors.bottomLeft;
                        ctx.fillRect(area.left, zeroY, zeroX - area.left, area.bottom - zeroY);
                        ctx.fillStyle = colors.bottomRight;
                        ctx.fillRect(zeroX, zeroY, area.right - zeroX, area.bottom - zeroY);
                        ctx.restore();
                    }
                }]
            });
        }
    }
}
