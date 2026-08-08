'use strict';
let $advanced = {
    prop: {
        months: ['1월',
            '2월',
            '3월',
            '4월',
            '5월',
            '6월',
            '7월'
        ],
        highlightIndex: -1,
        progressValue: 30
    },
    hook: {
        pageLoad() {
            $this.method.registerDerivedTypes();
            $this.method.playDecimation();
            $this.method.playDerivedAxis();
            $this.method.playDerivedChart();
            $this.method.playLinearGradient();
            $this.method.playProgrammatic();
            $this.method.playProgressBar();
            $this.method.playRadialGradient();
        }
    },
    event: {
        btnHighlightNext_click() {
            $this.method.advanceHighlight();
        },
        btnProgressAdvance_click() {
            $this.method.advanceProgress();
        }
    },
    method: {
        randomData(count, min, max) {
            return Array.from({
                length: count
            }, () => Math.round(min + Math.random() * (max - min)));
        },
        registerDerivedTypes() {
            try {
                if (!Chart.registry.scales.get('percent')) {
                    class PercentScale extends Chart.LinearScale {
                        getLabelForValue(value) {
                            return value + '%';
                        }
                    }
                    PercentScale.id = 'percent';
                    PercentScale.defaults = Chart.LinearScale.defaults;
                    Chart.register(PercentScale);
                }
            } catch (error) {
                syn.$l.eventLog('$advanced.registerDerivedTypes', error, 'Warning');
            }
            try {
                if (!Chart.registry.controllers.get('roundedBar')) {
                    class RoundedBarController extends Chart.BarController {
                    }
                    RoundedBarController.id = 'roundedBar';
                    RoundedBarController.defaults = Object.assign({
                    }, Chart.BarController.defaults, {
                        borderRadius: 12,
                        borderSkipped: false
                    });
                    Chart.register(RoundedBarController, Chart.BarElement);
                }
            } catch (error) {
                syn.$l.eventLog('$advanced.registerDerivedTypes', error, 'Warning');
            }
        },
        playDecimation() {
            const points = Array.from({
                length: 2000
            }, (_, index) => ({
                x: index,
                y: 50 + Math.sin(index / 40) * 30 + Math.random() * 8
            }));
            syn.uicontrols.$chartjs.setConfig('chtDecimation', {
                type: 'line',
                data: {
                    datasets: [{
                        label: '샘플 신호(2,000pt)',
                        data: points,
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgb(54, 162, 235)',
                        pointRadius: 0,
                        borderWidth: 1
                    }
                    ]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Data Decimation (lttb)'
                        },
                        legend: {
                            display: false
                        },
                        decimation: {
                            enabled: true,
                            algorithm: 'lttb',
                            samples: 80
                        }
                    },
                    parsing: false,
                    normalized: true,
                    scales: {
                        x: {
                            type: 'linear'
                        }
                    }
                }
            });
        },
        playDerivedAxis() {
            const months = $this.prop.months;
            syn.uicontrols.$chartjs.setConfig('chtDerivedAxis', {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [{
                        label: '달성률',
                        data: $this.method.randomData(months.length, 30, 95),
                        backgroundColor: 'rgb(75, 192, 192)'
                    }
                    ]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Derived Axis Type (percent)'
                        },
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            type: 'percent',
                            min: 0,
                            max: 100
                        }
                    }
                }
            });
        },
        playDerivedChart() {
            const months = $this.prop.months;
            const config = {
                data: {
                    labels: months,
                    datasets: [{
                        label: '매출',
                        data: $this.method.randomData(months.length, 20, 90),
                        backgroundColor: 'rgb(153, 102, 255)'
                    }
                    ]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Derived Chart Type (roundedBar)'
                        },
                        legend: {
                            display: false
                        }
                    }
                }
            };
            config.type = Chart.registry.controllers.get('roundedBar') ? 'roundedBar' : 'bar';
            if (config.type === 'bar') {
                config.data.datasets[0].borderRadius = 12;
                config.data.datasets[0].borderSkipped = false;
            }
            syn.uicontrols.$chartjs.setConfig('chtDerivedChart', config);
        },
        playLinearGradient() {
            const months = $this.prop.months;
            syn.uicontrols.$chartjs.setConfig('chtLinearGradient', {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [{
                        label: '매출',
                        data: $this.method.randomData(months.length, 30, 90),
                        backgroundColor(ctx) {
                            const chart = ctx.chart;
                            const area = chart.chartArea;
                            if (!area) {
                                return 'rgb(54, 162, 235)';
                            }
                            const gradient = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
                            gradient.addColorStop(0, 'rgba(54, 162, 235, 0.95)');
                            gradient.addColorStop(1, 'rgba(54, 162, 235, 0.15)');
                            return gradient;
                        }
                    }
                    ]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Linear Gradient'
                        },
                        legend: {
                            display: false
                        }
                    }
                }
            });
        },
        playProgrammatic() {
            const months = $this.prop.months;
            syn.uicontrols.$chartjs.setConfig('chtProgrammatic', {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: '방문자수',
                        data: $this.method.randomData(months.length, 20, 90),
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgb(255, 99, 132)'
                    }
                    ]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Programmatic Events'
                        }
                    }
                }
            });
            $this.prop.highlightIndex = -1;
        },
        advanceHighlight() {
            const chart = syn.uicontrols.$chartjs.getChartInstance('chtProgrammatic');
            if (!chart) {
                return;
            }
            const count = chart.data.labels.length;
            $this.prop.highlightIndex = ($this.prop.highlightIndex + 1) % count;
            const meta = chart.getDatasetMeta(0);
            const element = meta.data[$this.prop.highlightIndex];
            chart.setActiveElements([{
                datasetIndex: 0,
                index: $this.prop.highlightIndex
            }
            ]);
            chart.tooltip.setActiveElements([{
                datasetIndex: 0,
                index: $this.prop.highlightIndex
            }
            ], {
                x: element.x,
                y: element.y
            });
            chart.update();
        },
        playProgressBar() {
            $this.prop.progressValue = 30;
            $this.method.renderProgressBar();
        },
        advanceProgress() {
            $this.prop.progressValue = Math.min(100, $this.prop.progressValue + 10);
            $this.method.renderProgressBar();
        },
        renderProgressBar() {
            const value = $this.prop.progressValue;
            syn.uicontrols.$chartjs.setConfig('chtProgressBar', {
                type: 'doughnut',
                data: {
                    datasets: [{
                        data: [value,
                            100 - value
                        ],
                        backgroundColor: ['rgb(75, 192, 192)',
                            'rgba(201, 203, 207, 0.35)'
                        ],
                        borderWidth: 0
                    }
                    ]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Progress Bar'
                        },
                        legend: {
                            display: false
                        }
                    },
                    cutout: '75%',
                    animation: {
                        animateRotate: true,
                        duration: 500
                    }
                },
                plugins: [{
                    id: 'progressLabel',
                    afterDraw(chart) {
                        const ctx = chart.ctx;
                        const area = chart.chartArea;
                        const centerX = (area.left + area.right) / 2;
                        const centerY = (area.top + area.bottom) / 2;
                        ctx.save();
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.font = 'bold 22px sans-serif';
                        ctx.fillStyle = '#334155';
                        ctx.fillText(value + '%', centerX, centerY);
                        ctx.restore();
                    }
                }
                ]
            });
        },
        playRadialGradient() {
            const labels = ['1분기',
                '2분기',
                '3분기',
                '4분기',
                '5분기'
            ];
            const hues = [0,
                60,
                130,
                200,
                270
            ];
            syn.uicontrols.$chartjs.setConfig('chtRadialGradient', {
                type: 'polarArea',
                data: {
                    labels,
                    datasets: [{
                        data: $this.method.randomData(5, 20, 60),
                        backgroundColor(ctx) {
                            const chart = ctx.chart;
                            const area = chart.chartArea;
                            if (!area) {
                                return 'rgb(153, 102, 255)';
                            }
                            const centerX = (area.left + area.right) / 2;
                            const centerY = (area.top + area.bottom) / 2;
                            const radius = Math.min(area.right - area.left, area.bottom - area.top) / 2;
                            const hue = hues[ctx.dataIndex % hues.length];
                            const gradient = chart.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
                            gradient.addColorStop(0, `hsla(${hue}, 80%, 60%, 0.9)`);
                            gradient.addColorStop(1, `hsla(${hue}, 80%, 60%, 0.15)`);
                            return gradient;
                        }
                    }
                    ]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Radial Gradient'
                        },
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
    }
}
