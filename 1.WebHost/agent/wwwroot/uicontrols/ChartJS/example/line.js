'use strict';
let $line = {
    prop: {
        months: ['1월',
            '2월',
            '3월',
            '4월',
            '5월',
            '6월',
            '7월'
        ],
        colors: {
            red: 'rgb(255, 99, 132)',
            orange: 'rgb(255, 159, 64)',
            green: 'rgb(75, 192, 192)',
            blue: 'rgb(54, 162, 235)',
            purple: 'rgb(153, 102, 255)'
        }
    },
    hook: {
        pageLoad() {
            const $chartjs = syn.uicontrols.$chartjs;
            const months = $this.prop.months;
            const colors = $this.prop.colors;
            $chartjs.setConfig('chtLine', {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: '방문자수',
                        data: $this.method.randomData(months.length, 20, 90),
                        borderColor: colors.blue,
                        backgroundColor: colors.blue,
                        tension: 0.35
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Line Chart'
                        }
                    }
                }
            });
            $chartjs.setConfig('chtStyling', {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: '실선',
                        data: $this.method.randomData(months.length, 10, 60),
                        borderColor: colors.red,
                        backgroundColor: colors.red,
                        fill: false,
                        tension: 0
                    },
                    {
                        label: '점선',
                        data: $this.method.randomData(months.length, 10, 60),
                        borderColor: colors.blue,
                        backgroundColor: colors.blue,
                        borderDash: [6,
                            4
                        ],
                        fill: false,
                        tension: 0
                    },
                    {
                        label: '두꺼운 선 + 채우기',
                        data: $this.method.randomData(months.length, 10, 60),
                        borderColor: colors.green,
                        backgroundColor: 'rgba(75, 192, 192, 0.25)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Line Styling'
                        }
                    }
                }
            });
            $chartjs.setConfig('chtPointStyling', {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: 'circle',
                        data: $this.method.randomData(months.length, 10, 40),
                        borderColor: colors.red,
                        backgroundColor: colors.red,
                        pointStyle: 'circle',
                        pointRadius: 6,
                        pointHoverRadius: 9
                    },
                    {
                        label: 'triangle',
                        data: $this.method.randomData(months.length, 10, 40),
                        borderColor: colors.blue,
                        backgroundColor: colors.blue,
                        pointStyle: 'triangle',
                        pointRadius: 6,
                        pointHoverRadius: 9
                    },
                    {
                        label: 'rectRot',
                        data: $this.method.randomData(months.length, 10, 40),
                        borderColor: colors.purple,
                        backgroundColor: colors.purple,
                        pointStyle: 'rectRot',
                        pointRadius: 6,
                        pointHoverRadius: 9
                    },
                    {
                        label: 'star',
                        data: $this.method.randomData(months.length, 10, 40),
                        borderColor: colors.orange,
                        backgroundColor: colors.orange,
                        pointStyle: 'star',
                        pointRadius: 6,
                        pointHoverRadius: 9
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Point Styling'
                        }
                    }
                }
            });
            const segmentData = $this.method.randomData(months.length, 10, 90);
            $chartjs.setConfig('chtSegments', {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: '값이 감소하면 빨간 점선',
                        data: segmentData,
                        borderColor: colors.blue,
                        backgroundColor: colors.blue,
                        segment: {
                            borderColor: (ctx) => (ctx.p0.parsed.y > ctx.p1.parsed.y ? colors.red : undefined),
                            borderDash: (ctx) => (ctx.p0.parsed.y > ctx.p1.parsed.y ? [6,
                                4
                            ] : undefined)
                        }
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Segments'
                        }
                    }
                }
            });
            $chartjs.setConfig('chtStepped', {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: "stepped: 'before'",
                        data: $this.method.randomData(months.length, 10, 40),
                        borderColor: colors.red,
                        backgroundColor: colors.red,
                        fill: false,
                        stepped: 'before'
                    },
                    {
                        label: "stepped: 'middle'",
                        data: $this.method.randomData(months.length, 10, 40),
                        borderColor: colors.blue,
                        backgroundColor: colors.blue,
                        fill: false,
                        stepped: 'middle'
                    },
                    {
                        label: "stepped: 'after'",
                        data: $this.method.randomData(months.length, 10, 40),
                        borderColor: colors.green,
                        backgroundColor: colors.green,
                        fill: false,
                        stepped: 'after'
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Stepped Line'
                        }
                    }
                }
            });
            const interpolationData = $this.method.randomData(months.length, 10, 90);
            $chartjs.setConfig('chtInterpolation', {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: 'default (bezier)',
                        data: interpolationData,
                        borderColor: colors.red,
                        backgroundColor: colors.red,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: "cubicInterpolationMode: 'monotone'",
                        data: interpolationData,
                        borderColor: colors.blue,
                        backgroundColor: colors.blue,
                        fill: false,
                        cubicInterpolationMode: 'monotone',
                        tension: 0.4
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Cubic Interpolation Mode'
                        }
                    }
                }
            });
            $chartjs.setConfig('chtMultiAxis', {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: '방문자수(명)',
                        data: $this.method.randomData(months.length, 200, 900),
                        borderColor: colors.blue,
                        backgroundColor: colors.blue,
                        yAxisID: 'y'
                    },
                    {
                        label: '전환율(%)',
                        data: $this.method.randomData(months.length, 1, 12),
                        borderColor: colors.red,
                        backgroundColor: colors.red,
                        yAxisID: 'y1'
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Multi Axis'
                        }
                    },
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: '방문자수'
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: '전환율(%)'
                            },
                            grid: {
                                drawOnChartArea: false
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
        }
    }
}
