'use strict';
let $legend = {
    prop: {
        months: ['1월',
            '2월',
            '3월',
            '4월',
            '5월',
            '6월',
            '7월'
        ]
    },
    hook: {
        pageLoad() {
            const $chartjs = syn.uicontrols.$chartjs;
            const months = $this.prop.months;
            const palette = ['rgb(255, 99, 132)',
                'rgb(54, 162, 235)',
                'rgb(75, 192, 192)'
            ];
            const eventsDatasets = [{
                label: 'A팀',
                data: $this.method.randomData(months.length, 20, 60),
                borderColor: palette[0],
                backgroundColor: palette[0]
            },
            {
                label: 'B팀',
                data: $this.method.randomData(months.length, 20, 60),
                borderColor: palette[1],
                backgroundColor: palette[1]
            },
            {
                label: 'C팀',
                data: $this.method.randomData(months.length, 20, 60),
                borderColor: palette[2],
                backgroundColor: palette[2]
            }];
            $chartjs.setConfig('chtLegendEvents', {
                type: 'line',
                data: {
                    labels: months,
                    datasets: eventsDatasets
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Legend Events (범례에 마우스를 올려보세요)'
                        },
                        legend: {
                            onHover(event, legendItem, legend) {
                                legend.chart.data.datasets.forEach((dataset, index) => {
                                    dataset.borderColor = index === legendItem.datasetIndex ? palette[index] : 'rgba(200, 200, 200, 0.3)';
                                });
                                legend.chart.update();
                            },
                            onLeave(event, legendItem, legend) {
                                legend.chart.data.datasets.forEach((dataset, index) => {
                                    dataset.borderColor = palette[index];
                                });
                                legend.chart.update();
                            }
                        }
                    }
                }
            });
            $chartjs.setConfig('chtHtmlLegend', {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [{
                        label: '매출',
                        data: $this.method.randomData(months.length, 20, 60),
                        backgroundColor: palette[0]
                    },
                    {
                        label: '비용',
                        data: $this.method.randomData(months.length, 10, 40),
                        backgroundColor: palette[1]
                    },
                    {
                        label: '이익',
                        data: $this.method.randomData(months.length, 5, 20),
                        backgroundColor: palette[2]
                    }]
                },
                options: {
                    plugins: {
                        legend: {
                            display: false
                        },
                        htmlLegend: {
                            containerID: 'htmlLegend'
                        }
                    }
                },
                plugins: [$this.method.htmlLegendPlugin()]
            });
            $chartjs.setConfig('chtLegendPointStyle', {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: '동그라미',
                        data: $this.method.randomData(months.length, 10, 40),
                        borderColor: palette[0],
                        backgroundColor: palette[0],
                        pointStyle: 'circle',
                        pointRadius: 6
                    },
                    {
                        label: '세모',
                        data: $this.method.randomData(months.length, 10, 40),
                        borderColor: palette[1],
                        backgroundColor: palette[1],
                        pointStyle: 'triangle',
                        pointRadius: 6
                    },
                    {
                        label: '네모',
                        data: $this.method.randomData(months.length, 10, 40),
                        borderColor: palette[2],
                        backgroundColor: palette[2],
                        pointStyle: 'rect',
                        pointRadius: 6
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Point Style'
                        },
                        legend: {
                            labels: {
                                usePointStyle: true,
                                pointStyleWidth: 12
                            }
                        }
                    }
                }
            });
            const positionDataset = () => ({
                labels: ['빨강',
                    '파랑',
                    '초록'
                ],
                datasets: [{
                    data: [30,
                        40,
                        30
                    ],
                    backgroundColor: palette
                }]
            });
            ['Top',
                'Bottom',
                'Left',
                'Right'
            ].forEach((position) => {
                $chartjs.setConfig('chtLegend' + position, {
                    type: 'doughnut',
                    data: positionDataset(),
                    options: {
                        plugins: {
                            legend: {
                                position: position.toLowerCase()
                            }
                        }
                    }
                });
            });
            $chartjs.setConfig('chtLegendTitle', {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [{
                        label: '매출',
                        data: $this.method.randomData(months.length, 20, 60),
                        backgroundColor: palette[0]
                    },
                    {
                        label: '비용',
                        data: $this.method.randomData(months.length, 10, 40),
                        backgroundColor: palette[1]
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Legend Title'
                        },
                        legend: {
                            title: {
                                display: true,
                                text: '항목 (클릭하면 숨김/표시)'
                            }
                        }
                    }
                }
            });
        }
    },
    method: {
        randomData(count, min, max) {
            return Array.from({
                length: count
            }, () => Math.round(min + Math.random() * (max - min)));
        },
        htmlLegendPlugin() {
            return {
                id: 'htmlLegend',
                afterUpdate(chart, args, pluginOptions) {
                    const container = syn.$l.get(pluginOptions.containerID);
                    if (!container) {
                        return;
                    }
                    container.innerHTML = '';
                    const items = chart.options.plugins.legend.labels.generateLabels(chart);
                    items.forEach((item) => {
                        const li = document.createElement('li');
                        li.className = item.hidden ? 'hidden' : '';
                        li.addEventListener('click', () => {
                            chart.setDatasetVisibility(item.datasetIndex, !chart.isDatasetVisible(item.datasetIndex));
                            chart.update();
                        });
                        const swatch = document.createElement('span');
                        swatch.className = 'swatch';
                        swatch.style.background = item.fillStyle;
                        const text = document.createElement('span');
                        text.textContent = item.text;
                        li.appendChild(swatch);
                        li.appendChild(text);
                        container.appendChild(li);
                    });
                }
            };
        }
    }
}
